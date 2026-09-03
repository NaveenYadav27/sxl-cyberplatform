from fastapi import APIRouter, Depends, Body, HTTPException
from datetime import datetime
from typing import Dict, Any, List
from app.infrastructure.proxmox_adapter import proxmox_adapter
from app.infrastructure.vbox_adapter import vbox_adapter
from app.infrastructure.splunk_adapter import splunk_adapter
from app.auth.security import get_current_user

router = APIRouter(prefix="/connectors", tags=["Hypervisors & SIEM Connectors"])

@router.get("/status")
async def get_connectors_status() -> Dict[str, Any]:
    """Source-of-truth connection state for Proxmox, VirtualBox, Splunk."""
    return {
        "proxmox": {
            "name": "Proxmox VE Hypervisor",
            "connected": proxmox_adapter.is_connected,
            "status": "connected" if proxmox_adapter.is_connected else "disconnected",
            "host": proxmox_adapter.host,
            "last_seen": proxmox_adapter.last_seen.isoformat() + "Z" if proxmox_adapter.last_seen else None
        },
        "virtualbox": {
            "name": "VirtualBox Host Agent",
            "connected": len([a for a in vbox_adapter.connected_agents.values() if a["status"] == "connected"]) > 0,
            "registered_agents": list(vbox_adapter.connected_agents.values()),
            "status": "connected" if len(vbox_adapter.connected_agents) > 0 else "disconnected"
        },
        "splunk": {
            "name": "Splunk Enterprise SIEM",
            "connected": splunk_adapter.is_connected,
            "status": "connected" if splunk_adapter.is_connected else "disconnected",
            "host": splunk_adapter.host,
            "last_search_time": splunk_adapter.last_search_time.isoformat() + "Z" if splunk_adapter.last_search_time else None
        },
        "source": "connectors_manager",
        "last_updated": datetime.utcnow().isoformat() + "Z"
    }

@router.post("/proxmox/test")
async def test_proxmox_connection(
    payload: Dict[str, str] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    host = payload.get("host", "192.168.1.200")
    token_id = payload.get("token_id", "root@pam!shadowxlab")
    token_secret = payload.get("token_secret", "dummy-secret")
    
    test_res = await proxmox_adapter.test_connection(host, token_id, token_secret)
    vms = await proxmox_adapter.get_vm_inventory()
    return {
        "connection": test_res,
        "vms_discovered": vms
    }

@router.post("/vbox/agent/register")
async def register_vbox_agent(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """Called by out-of-band VirtualBox Host Agent on physical host."""
    agent_id = payload.get("agent_id", "vbox-host-01")
    host_os = payload.get("host_os", "windows")
    version = payload.get("version", "1.0.0")
    vm_count = payload.get("vm_count", 0)
    
    reg_result = vbox_adapter.register_agent(agent_id, host_os, version, vm_count)
    if "vms" in payload:
        correlated_vms = await vbox_adapter.ingest_vbox_vms(agent_id, payload["vms"])
        reg_result["correlated_vms"] = correlated_vms
    return reg_result

@router.post("/splunk/search")
async def execute_splunk_search(
    payload: Dict[str, str] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    query = payload.get("spl_query", "search index=cyber_range | head 10")
    events = await splunk_adapter.execute_spl_search(query, {})
    return {
        "status": "success",
        "query": query,
        "normalized_events_count": len(events),
        "events": events
    }
