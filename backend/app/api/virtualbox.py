from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.infrastructure.vbox_manager import vbox_manager

router = APIRouter(prefix="/virtualbox", tags=["VirtualBox Hypervisor"])

class RoleAssignmentRequest(BaseModel):
    uuid: str
    name: str
    role: str
    ip: Optional[str] = None
    target_labs: List[Any] = []

class StartVmRequest(BaseModel):
    mode: str = "gui"  # "gui", "headless", "separate"

class ControlVmRequest(BaseModel):
    action: str  # "savestate", "pause", "resume", "poweroff", "acpipowerbutton", "reset"

class SnapshotRequest(BaseModel):
    snapshot_name: str
    description: str = ""

class CloneVmRequest(BaseModel):
    new_name: str
    mode: str = "full"  # "full" or "linked"
    snapshot_name: Optional[str] = None

class ModifyAdapterRequest(BaseModel):
    nic_index: int = 1
    mode: str = "nat"  # nat, bridged, hostonly, intnet, natnetwork
    network_name: Optional[str] = None

class CableStateRequest(BaseModel):
    nic_index: int = 1
    connected: bool = True

class PortForwardRequest(BaseModel):
    nic_index: int = 1
    name: str
    proto: str = "tcp"
    host_port: int
    guest_port: int
    host_ip: str = ""
    guest_ip: str = ""

class GuestExecRequest(BaseModel):
    username: str
    password: str
    command: str
    args: List[str] = []

class ConnectivityTestRequest(BaseModel):
    ip: str
    port: Optional[int] = None

class LabBindingRequest(BaseModel):
    lab_id: str
    vm_uuid: Optional[str] = None
    custom_ip: Optional[str] = None
    custom_name: Optional[str] = None

@router.get("/status")
async def get_vbox_status():
    """Get Oracle VirtualBox hypervisor status and version."""
    return vbox_manager.get_status()

@router.get("/vms")
async def list_vbox_vms():
    """List all registered and running VirtualBox VMs with roles and dynamic network context."""
    return {
        "status": "ok",
        "hypervisor": vbox_manager.get_status(),
        "vms": vbox_manager.list_vms()
    }

@router.post("/vms/role")
async def set_vm_role(payload: RoleAssignmentRequest):
    """Assign or update a SOC Lab role and IP address for a VirtualBox VM."""
    return vbox_manager.set_vm_role(
        uuid_str=payload.uuid,
        name=payload.name,
        role=payload.role,
        ip=payload.ip,
        target_labs=payload.target_labs
    )

@router.post("/vms/{vm_id}/start")
async def start_vm(vm_id: str, payload: StartVmRequest):
    """Start a VirtualBox virtual machine (GUI, Headless, or Separate Detachable)."""
    res = vbox_manager.start_vm(vm_id, mode=payload.mode)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/control")
async def control_vm(vm_id: str, payload: ControlVmRequest):
    """Control running state: savestate, pause, resume, poweroff, acpipowerbutton, reset."""
    res = vbox_manager.control_vm(vm_id, action=payload.action)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.get("/vms/{vm_id}/snapshots")
async def list_snapshots(vm_id: str):
    """List all snapshots for a VirtualBox VM."""
    return {
        "status": "ok",
        "snapshots": vbox_manager.list_snapshots(vm_id)
    }

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

@router.delete("/vms/{vm_id}/snapshots/{snapshot_name}")
async def delete_snapshot(vm_id: str, snapshot_name: str):
    """Delete / merge a snapshot."""
    res = vbox_manager.delete_snapshot(vm_id, snapshot_name=snapshot_name)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/clone")
async def clone_vm(vm_id: str, payload: CloneVmRequest):
    """Clone a VirtualBox VM (Full or Linked Clone)."""
    res = vbox_manager.clone_vm(vm_id, new_name=payload.new_name, mode=payload.mode, snapshot_name=payload.snapshot_name)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.get("/vms/{vm_id}/adapters")
async def get_vm_adapters(vm_id: str):
    """Get configuration of all 4 network adapters on the VM."""
    return {
        "status": "ok",
        "adapters": vbox_manager.get_vm_adapters(vm_id)
    }

@router.post("/vms/{vm_id}/adapters")
async def modify_adapter(vm_id: str, payload: ModifyAdapterRequest):
    """Reconfigure an adapter mode: nat, bridged, hostonly, intnet, natnetwork."""
    res = vbox_manager.modify_adapter(vm_id, nic_index=payload.nic_index, mode=payload.mode, network_name=payload.network_name)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/cable")
async def set_cable_state(vm_id: str, payload: CableStateRequest):
    """Simulate plugging or unplugging physical network cable (air-gap drill)."""
    res = vbox_manager.set_cable_state(vm_id, nic_index=payload.nic_index, connected=payload.connected)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.get("/vms/{vm_id}/port-forwards")
async def list_port_forwards(vm_id: str, nic_index: int = 1):
    """List NAT port forwarding rules."""
    return {
        "status": "ok",
        "rules": vbox_manager.list_port_forwards(vm_id, nic_index=nic_index)
    }

@router.post("/vms/{vm_id}/port-forwards")
async def add_port_forward(vm_id: str, payload: PortForwardRequest):
    """Add a NAT port forwarding rule."""
    res = vbox_manager.add_port_forward(
        vm_id, nic_index=payload.nic_index, name=payload.name, proto=payload.proto,
        host_port=payload.host_port, guest_port=payload.guest_port,
        host_ip=payload.host_ip, guest_ip=payload.guest_ip
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.delete("/vms/{vm_id}/port-forwards/{rule_name}")
async def delete_port_forward(vm_id: str, rule_name: str, nic_index: int = 1):
    """Delete a NAT port forwarding rule."""
    res = vbox_manager.delete_port_forward(vm_id, nic_index=nic_index, name=rule_name)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/guest-exec")
async def exec_guest_command(vm_id: str, payload: GuestExecRequest):
    """Execute a command directly inside guest OS via VBoxManage guestcontrol."""
    res = vbox_manager.exec_guest_command(
        vm_id, username=payload.username, password=payload.password,
        command=payload.command, args=payload.args
    )
    return res

@router.get("/host-networks")
async def get_host_networks():
    """List VirtualBox Host-Only interfaces, NAT networks, and DHCP lease servers."""
    return {
        "status": "ok",
        "host_only_interfaces": vbox_manager.list_host_interfaces(),
        "nat_networks": vbox_manager.list_nat_networks(),
        "dhcp_servers": vbox_manager.list_dhcp_servers()
    }

@router.get("/lab-bindings")
async def get_lab_bindings():
    """Get dynamic mapping between SOC Labs and VirtualBox VMs."""
    return {
        "status": "ok",
        "bindings": vbox_manager.get_lab_bindings()
    }

@router.post("/lab-bindings")
async def save_lab_binding(payload: LabBindingRequest):
    """Save a dynamic lab to VM mapping."""
    return vbox_manager.save_lab_binding(
        lab_id=payload.lab_id,
        vm_uuid=payload.vm_uuid,
        custom_ip=payload.custom_ip,
        custom_name=payload.custom_name
    )

@router.post("/lab-bindings/auto-bind")
async def auto_bind_labs():
    """Auto-bind detected VirtualBox VMs to matching foundation labs."""
    return vbox_manager.auto_bind_detected_vms()

@router.post("/test-connectivity")
async def test_vm_connectivity(payload: ConnectivityTestRequest):
    """Test live ICMP ping latency and TCP port socket reachability to a VM."""
    return vbox_manager.test_connectivity(ip=payload.ip, port=payload.port)
