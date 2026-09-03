from fastapi import APIRouter, Depends, Query, HTTPException, Body
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import select, func
from app.database import get_db, AsyncSession, async_session_maker, AssetModel
from app.discovery.scanner import active_scanner
from app.websocket.event_bus import event_bus

router = APIRouter(prefix="/assets", tags=["Asset Registry & Active Scanner"])

async def process_discovered_assets(discovered_items: List[Dict[str, Any]], agent_id: str):
    """
    Called by Edge Agent during continuous discovery.
    Updates asset lifecycle state: DISCOVERED -> ACTIVE -> DEGRADED -> OFFLINE -> REMOVED.
    Never deletes assets on VM shutdown or removal to preserve historical evidence.
    """
    async with async_session_maker() as session:
        for item in discovered_items:
            vmid = str(item.get("vmid", ""))
            name = item.get("name") or item.get("hostname")
            ip = item.get("ip")
            mac = item.get("mac")
            os_type = item.get("os", "windows" if "win" in str(name).lower() or "dc" in str(name).lower() else "linux")
            vm_status = item.get("status", "running")
            source = item.get("discovery_source", "qemu_agent")
            confidence = float(item.get("confidence", 0.95))
            open_ports = item.get("open_ports", [])

            # Query by vmid or MAC or IP or Hostname
            query = select(AssetModel).where(
                (AssetModel.vmid == vmid) |
                ((AssetModel.mac_address == mac) & (AssetModel.mac_address.isnot(None))) |
                ((AssetModel.ip_address == ip) & (AssetModel.ip_address.isnot(None))) |
                (AssetModel.hostname == name)
            )
            res = await session.execute(query)
            asset = res.scalars().first()

            if asset:
                asset.hostname = name or asset.hostname
                if ip and ip != "Detecting...":
                    asset.ip_address = ip
                if mac:
                    asset.mac_address = mac
                if open_ports:
                    asset.open_ports = open_ports
                asset.vm_status = vm_status
                asset.last_seen = datetime.utcnow()
                asset.agent_id = agent_id

                if vm_status == "running":
                    asset.status = "ACTIVE"
                elif vm_status in ["stopped", "paused"]:
                    asset.status = "OFFLINE"
            else:
                new_asset = AssetModel(
                    hostname=name,
                    ip_address=ip if ip != "Detecting..." else None,
                    mac_address=mac,
                    os_type=os_type,
                    status="ACTIVE" if vm_status == "running" else "DISCOVERED",
                    confidence_score=confidence,
                    discovery_source=source,
                    hypervisor_type="proxmox" if item.get("is_real") and vmid.isdigit() else "physical",
                    hypervisor_node=item.get("node", "pve"),
                    vmid=vmid,
                    vm_status=vm_status,
                    agent_id=agent_id,
                    open_ports=open_ports
                )
                session.add(new_asset)

        await session.commit()

    # Broadcast updated asset count to UI
    await event_bus.broadcast("ASSETS_UPDATED", {"timestamp": datetime.utcnow().isoformat() + "Z"})

@router.get("/")
async def list_assets(
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[str] = None
) -> Dict[str, Any]:
    """Source-of-truth asset registry with 5-stage lifecycle and confidence scores."""
    query = select(AssetModel).order_by(AssetModel.last_seen.desc())
    if status_filter:
        query = query.where(AssetModel.status == status_filter)
        
    res = await db.execute(query)
    assets = res.scalars().all()
    
    total = len(assets)
    active = sum(1 for a in assets if a.status == "ACTIVE")
    offline = sum(1 for a in assets if a.status == "OFFLINE")
    windows = sum(1 for a in assets if a.os_type == "windows")
    linux = sum(1 for a in assets if a.os_type in ["linux", "kali"])
    
    asset_list = []
    for a in assets:
        asset_list.append({
            "asset_id": a.asset_id,
            "hostname": a.hostname,
            "ip_address": a.ip_address,
            "mac_address": a.mac_address,
            "os_type": a.os_type,
            "status": a.status,
            "confidence_score": a.confidence_score,
            "discovery_source": a.discovery_source,
            "hypervisor": {
                "type": a.hypervisor_type,
                "node": a.hypervisor_node,
                "vmid": a.vmid,
                "vm_status": a.vm_status
            },
            "agent_id": a.agent_id,
            "open_ports": a.open_ports or [],
            "first_seen": a.first_seen.isoformat() + "Z" if a.first_seen else None,
            "last_seen": a.last_seen.isoformat() + "Z" if a.last_seen else None
        })

    return {
        "metric": "Active Target Hosts",
        "value": active if total > 0 else "N/A",
        "total_hosts": total,
        "active_hosts": active,
        "offline_hosts": offline,
        "windows_hosts": windows,
        "linux_hosts": linux,
        "assets": asset_list,
        "source": "Proxmox / VirtualBox Edge Connectors",
        "last_updated": datetime.utcnow().isoformat() + "Z",
        "freshness": "LIVE" if total > 0 else "N/A",
        "status": "LIVE" if active > 0 else ("DISCONNECTED" if total == 0 else "DEGRADED"),
        "confidence": 1.0 if total > 0 else 0.0
    }

@router.post("/scan")
async def trigger_full_scan() -> Dict[str, Any]:
    """Scans all registered assets for open ports and services."""
    results = []
    async with async_session_maker() as session:
        res = await session.execute(select(AssetModel))
        assets = res.scalars().all()
        for a in assets:
            scan_res = await active_scanner.scan_and_update_asset(a.asset_id)
            results.append(scan_res)
    return {"status": "completed", "scanned_hosts": results}

@router.post("/{asset_id}/scan")
async def scan_single_asset(asset_id: str) -> Dict[str, Any]:
    """Actively scans a single cyber-range asset for open ports."""
    return await active_scanner.scan_and_update_asset(asset_id)

@router.post("/")
async def create_manual_asset(
    hostname: str = Body(...),
    ip_address: str = Body(...),
    os_type: str = Body("linux"),
    mac_address: Optional[str] = Body(None),
    hypervisor_type: str = Body("virtualbox"),
    open_ports: List[int] = Body([]),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Manually register a local host or VirtualBox VM for practice."""
    # Check if host exists by IP or Hostname
    query = select(AssetModel).where(
        (AssetModel.ip_address == ip_address) |
        (AssetModel.hostname == hostname)
    )
    res = await db.execute(query)
    existing = res.scalars().first()
    
    if existing:
        existing.hostname = hostname
        existing.ip_address = ip_address
        existing.os_type = os_type
        if mac_address:
            existing.mac_address = mac_address
        existing.hypervisor_type = hypervisor_type
        existing.open_ports = open_ports
        existing.status = "ACTIVE"
        existing.last_seen = datetime.utcnow()
        await db.commit()
        asset = existing
    else:
        asset = AssetModel(
            hostname=hostname,
            ip_address=ip_address,
            mac_address=mac_address,
            os_type=os_type,
            status="ACTIVE",
            confidence_score=1.0,
            discovery_source="manual",
            hypervisor_type=hypervisor_type,
            hypervisor_node="local",
            vm_status="running",
            open_ports=open_ports
        )
        db.add(asset)
        await db.commit()
        await db.refresh(asset)
        
    # Broadcast updated asset count to UI
    await event_bus.broadcast("ASSETS_UPDATED", {"timestamp": datetime.utcnow().isoformat() + "Z"})
    
    return {
        "status": "success",
        "asset_id": asset.asset_id,
        "hostname": asset.hostname,
        "ip_address": asset.ip_address,
        "status": asset.status
    }

@router.delete("/{asset_id}")
async def delete_asset(asset_id: str, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Delete a manually registered asset."""
    query = select(AssetModel).where(AssetModel.asset_id == asset_id)
    res = await db.execute(query)
    asset = res.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    await db.delete(asset)
    await db.commit()
    
    # Broadcast updated asset count to UI
    await event_bus.broadcast("ASSETS_UPDATED", {"timestamp": datetime.utcnow().isoformat() + "Z"})
    
    return {"status": "success", "message": "Asset deleted successfully"}

