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


class UpdateSettingsRequest(BaseModel):
    memory_mb: Optional[int] = None
    cpus: Optional[int] = None
    vram_mb: Optional[int] = None
    graphics_controller: Optional[str] = None
    boot1: Optional[str] = None
    boot2: Optional[str] = None
    boot3: Optional[str] = None

class MountIsoRequest(BaseModel):
    iso_path: str

class ExportOvaRequest(BaseModel):
    output_path: Optional[str] = None

class RemoveVmRequest(BaseModel):
    delete_files: bool = False

@router.get("/vms/{vm_id}/settings")
async def get_vm_settings(vm_id: str):
    """Get full hardware settings for a VM (RAM, CPUs, VRAM, Boot, Graphics, Storage)."""
    return {
        "status": "ok",
        "settings": vbox_manager.get_vm_extended_info(vm_id)
    }

@router.post("/vms/{vm_id}/settings")
async def update_vm_settings(vm_id: str, payload: UpdateSettingsRequest):
    """Modify VM hardware settings (RAM, CPUs, VRAM, Graphics, Boot)."""
    res = vbox_manager.update_vm_settings(
        vm_id, memory_mb=payload.memory_mb, cpus=payload.cpus,
        vram_mb=payload.vram_mb, graphics_controller=payload.graphics_controller,
        boot1=payload.boot1, boot2=payload.boot2, boot3=payload.boot3
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/discard-state")
async def discard_saved_state(vm_id: str):
    """Discard saved state to poweroff VM."""
    res = vbox_manager.discard_saved_state(vm_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/keys")
async def send_vm_keys(vm_id: str, combo: str = "ctrl-alt-del"):
    """Send keyboard scancodes to running VM (e.g. Ctrl+Alt+Del)."""
    res = vbox_manager.send_keys(vm_id, combo=combo)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.get("/vms/{vm_id}/screenshot")
async def get_vm_screenshot(vm_id: str):
    """Capture live screenshot from running VM screen."""
    return vbox_manager.take_screenshot(vm_id)

@router.get("/vms/{vm_id}/logs")
async def get_vm_logs(vm_id: str, max_lines: int = 150):
    """Read recent lines from VBox.log."""
    return vbox_manager.get_vm_logs(vm_id, max_lines=max_lines)

@router.post("/vms/{vm_id}/open-folder")
async def open_vm_folder(vm_id: str):
    """Open VM folder in Windows Explorer."""
    return vbox_manager.open_vm_folder(vm_id)

@router.post("/vms/{vm_id}/mount-guest-additions")
async def mount_guest_additions(vm_id: str):
    """Mount VBoxGuestAdditions.iso to optical drive."""
    res = vbox_manager.mount_guest_additions(vm_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/mount-iso")
async def mount_iso(vm_id: str, payload: MountIsoRequest):
    """Mount custom ISO to optical drive."""
    res = vbox_manager.mount_iso(vm_id, payload.iso_path)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/eject-iso")
async def eject_iso(vm_id: str):
    """Eject optical drive."""
    res = vbox_manager.eject_iso(vm_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/export-ova")
async def export_ova(vm_id: str, payload: ExportOvaRequest):
    """Export VM to OVA package."""
    res = vbox_manager.export_ova(vm_id, payload.output_path)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/vms/{vm_id}/remove")
async def remove_vm(vm_id: str, payload: RemoveVmRequest):
    """Unregister VM from VirtualBox."""
    res = vbox_manager.remove_vm(vm_id, delete_files=payload.delete_files)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res
