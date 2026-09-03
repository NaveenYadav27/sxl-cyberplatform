from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.infrastructure.proxmox_engine import proxmox_engine, ProxmoxConfig

router = APIRouter(prefix="/proxmox", tags=["Real Proxmox VE Integration"])

@router.get("/status")
async def get_proxmox_status():
    """Returns real-time cluster status and connection state."""
    cfg = proxmox_engine.config
    return {
        "status": "LIVE" if proxmox_engine.is_connected else "DISCONNECTED",
        "is_connected": proxmox_engine.is_connected,
        "host": cfg.host,
        "node_name": cfg.node_name,
        "mode": "read-only",
        "last_error": proxmox_engine.last_error,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@router.get("/config")
async def get_proxmox_config():
    """Returns currently saved user Proxmox configuration."""
    cfg = proxmox_engine.config
    return {
        "host": cfg.host,
        "token_id": cfg.token_id,
        "node_name": cfg.node_name,
        "verify_ssl": cfg.verify_ssl,
        "has_token_secret": bool(cfg.token_secret),
        "is_connected": proxmox_engine.is_connected,
        "last_error": proxmox_engine.last_error
    }

@router.post("/test")
async def test_proxmox_connection(payload: Dict[str, Any] = Body(...)):
    """Executes a real live API test against the user's Proxmox VE server."""
    host = payload.get("host", "").strip()
    token_id = payload.get("token_id", "").strip()
    token_secret = payload.get("token_secret", "").strip()
    node_name = payload.get("node_name", "pve").strip()
    verify_ssl = payload.get("verify_ssl", False)

    if not host or not token_id or not token_secret:
        raise HTTPException(status_code=400, detail="Host URL, Token ID, and Token Secret are all required.")

    new_cfg = ProxmoxConfig(
        host=host,
        token_id=token_id,
        token_secret=token_secret,
        node_name=node_name,
        verify_ssl=verify_ssl
    )

    result = await proxmox_engine.test_and_connect(new_cfg)
    return result

@router.get("/vms")
async def get_real_vms():
    """Fetches real live VMs from the user's Proxmox server."""
    vms = await proxmox_engine.get_real_vms()
    return {
        "vms": vms,
        "count": len(vms),
        "host": proxmox_engine.config.host,
        "node": proxmox_engine.config.node_name,
        "is_connected": proxmox_engine.is_connected
    }

@router.post("/vms/{vmid}/snapshot/rollback")
async def rollback_snapshot(vmid: int, payload: Dict[str, Any] = Body(default={})):
    """Triggers snapshot rollback on the specified Proxmox VM."""
    snapname = payload.get("snapname", "baseline-clean")
    res = await proxmox_engine.rollback_snapshot(vmid, snapname)
    return res
