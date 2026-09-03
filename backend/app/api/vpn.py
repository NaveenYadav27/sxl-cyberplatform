from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.infrastructure.vpn_manager import vpn_manager
from app.infrastructure.vbox_manager import vbox_manager

router = APIRouter(prefix="/vpn", tags=["VPN Mesh Gateway"])

class CreatePeerRequest(BaseModel):
    vm_name: str
    native_ip: Optional[str] = "127.0.0.1"
    os_type: Optional[str] = "linux"
    role: Optional[str] = "Target Node"

class HandshakeRequest(BaseModel):
    peer_id: str
    token: str

class PingRequest(BaseModel):
    peer_id: str

@router.get("/status")
def get_vpn_status():
    """Return central VPN mesh overlay status."""
    return vpn_manager.get_status()

@router.get("/peers")
def get_vpn_peers():
    """List all enrolled peers on the 10.8.0.0/24 mesh."""
    return vpn_manager.get_peers()

@router.post("/peers/create")
def create_vpn_peer(req: CreatePeerRequest):
    """Enroll a new VM or agent into the VPN mesh."""
    peer = vpn_manager.create_or_update_peer(
        vm_name=req.vm_name,
        native_ip=req.native_ip or "127.0.0.1",
        os_type=req.os_type or "linux",
        role=req.role or "Target Node"
    )
    return peer

@router.get("/peers/{peer_id}/script")
def get_peer_script(peer_id: str, request: Request):
    """Get automated deployment script and one-liner for a peer."""
    host = request.headers.get("host", "127.0.0.1:8000").split(":")[0]
    try:
        return vpn_manager.generate_client_script(peer_id, host_ip=host)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/peers/{peer_id}/script/download")
def download_peer_script(peer_id: str, request: Request):
    """Raw script download endpoint for curl | bash execution."""
    host = request.headers.get("host", "127.0.0.1:8000").split(":")[0]
    try:
        data = vpn_manager.generate_client_script(peer_id, host_ip=host)
        return PlainTextResponse(content=data["content"])
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/auto-detect-vms")
def auto_detect_vms():
    """
    Scan active VirtualBox VMs across different networks (NAT, Bridged, Host-Only),
    and automatically register them as peers on the 10.8.0.0/24 VPN mesh.
    """
    active_vms = vbox_manager.detect_active_vms_network()
    enrolled = []

    for vm in active_vms:
        role = "SOC Analyst Node" if "kali" in vm["name"].lower() else \
               "pfSense Gateway" if "pfsense" in vm["name"].lower() else \
               "Vulnerable Target" if "meta" in vm["name"].lower() else \
               "Corporate Endpoint"
        peer = vpn_manager.create_or_update_peer(
            vm_name=vm["name"],
            native_ip=vm.get("detected_ip", "10.10.20.1"),
            os_type=vm.get("os", "linux"),
            role=role
        )
        enrolled.append({**vm, "vpn_peer": peer})

    return {
        "active_vms_found": len(active_vms),
        "enrolled_vms": enrolled,
        "vpn_server": vpn_manager.server_ip,
        "mesh_subnet": vpn_manager.mesh_subnet
    }

@router.post("/handshake")
def record_handshake(req: HandshakeRequest):
    """Keepalive and handshake endpoint called by the guest agent."""
    ok = vpn_manager.record_handshake(req.peer_id, req.token)
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid peer handshake token")
    return {"status": "ok", "message": "Handshake recorded successfully"}

@router.post("/ping-peer")
def ping_peer(req: PingRequest):
    """Test reachability to a VM peer."""
    return vpn_manager.ping_peer(req.peer_id)
