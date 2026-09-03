from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.infrastructure.vbox_manager import vbox_manager

router = APIRouter(prefix="/virtualbox", tags=["VirtualBox Hypervisor"])

class RoleAssignmentRequest(BaseModel):
    uuid: str
    name: str
    role: str
    ip: Optional[str] = None
    target_labs: List[int] = []

class StartVmRequest(BaseModel):
    mode: str = "gui"  # "gui" or "headless"

class ControlVmRequest(BaseModel):
    action: str  # "poweroff", "acpipowerbutton", "pause", "resume", "reset"

class SnapshotRequest(BaseModel):
    snapshot_name: str
    description: str = ""

class ConnectivityTestRequest(BaseModel):
    ip: str
    port: Optional[int] = None

@router.get("/status")
async def get_vbox_status():
    """Get Oracle VirtualBox hypervisor status and version."""
    return vbox_manager.get_status()

@router.get("/vms")
async def list_vbox_vms():
    """List all registered and running VirtualBox VMs with roles and network context."""
    return {
        "status": "ok",
        "hypervisor": vbox_manager.get_status(),
        "vms": vbox_manager.list_vms()
    }

@router.post("/vms/role")
async def set_vm_role(payload: RoleAssignmentRequest):
    """Assign or update a SOC Lab role and IP address for a VirtualBox VM."""
    res = vbox_manager.set_vm_role(
        uuid_str=payload.uuid,
        name=payload.name,
        role=payload.role,
        ip=payload.ip,
        target_labs=payload.target_labs
    )
    return res

@router.post("/vms/{vm_id}/start")
async def start_vm(vm_id: str, payload: StartVmRequest):
    """Start a VirtualBox virtual machine (GUI or Headless)."""
    res = vbox_manager.start_vm(vm_id, mode=payload.mode)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/control")
async def control_vm(vm_id: str, payload: ControlVmRequest):
    """Control running state: poweroff, acpipowerbutton, pause, resume, reset."""
    res = vbox_manager.control_vm(vm_id, action=payload.action)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/snapshot")
async def take_snapshot(vm_id: str, payload: SnapshotRequest):
    """Take a named snapshot of a VirtualBox VM for lab state saving."""
    res = vbox_manager.take_snapshot(vm_id, snapshot_name=payload.snapshot_name, description=payload.description)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/restore")
async def restore_snapshot(vm_id: str, payload: SnapshotRequest):
    """Restore a VirtualBox VM to a snapshot."""
    res = vbox_manager.restore_snapshot(vm_id, snapshot_name=payload.snapshot_name)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/test-connectivity")
async def test_vm_connectivity(payload: ConnectivityTestRequest):
    """Test live ICMP ping latency and TCP port socket reachability to a VM."""
    return vbox_manager.test_connectivity(ip=payload.ip, port=payload.port)
