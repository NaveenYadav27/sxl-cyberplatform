import os
import re
import json
import socket
import logging
import subprocess
from datetime import datetime
from typing import Dict, Any, List, Optional

logger = logging.getLogger("VBoxManager")

DEFAULT_VBOX_PATHS = [
    r"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe",
    r"C:\Program Files (x86)\Oracle\VirtualBox\VBoxManage.exe",
    "VBoxManage.exe",
    "VBoxManage",
]

TOPOLOGY_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "vbox_lab_topology.json")

class VirtualBoxManager:
    """Enterprise VirtualBox Hypervisor Engine for ShadowXLab Cyber Range."""

    def __init__(self):
        self.vbox_bin = self._find_vboxmanage()
        self._ensure_data_dir()

    def _ensure_data_dir(self):
        data_dir = os.path.dirname(TOPOLOGY_FILE)
        os.makedirs(data_dir, exist_ok=True)
        if not os.path.exists(TOPOLOGY_FILE):
            default_topology = {
                "created_at": datetime.utcnow().isoformat() + "Z",
                "vms": {},
                "roles": {
                    "pfsense vm": {"role": "pfSense Perimeter Gateway", "target_labs": ["L14", "L19", "L26", "L32"], "ip": "10.10.20.1"},
                    "kali linux": {"role": "SOC Analyst / Red Attacker", "target_labs": ["L08", "L10", "L16", "L20", "L35", "L38", "L40"], "ip": "192.168.1.33"},
                    "Metasploitable VM": {"role": "Vulnerable Target Web & DB Server", "target_labs": ["L21", "L22", "L27", "L36"], "ip": "10.10.20.15"},
                    "Cybersecurity LabVM Worksation 20250409": {"role": "Corporate Windows / Linux Endpoint", "target_labs": ["L01", "L02", "L06", "L30", "L31", "L40"], "ip": "10.10.20.44"}
                },
                "lab_bindings": {}
            }
            try:
                with open(TOPOLOGY_FILE, "w", encoding="utf-8") as f:
                    json.dump(default_topology, f, indent=2)
            except Exception as e:
                logger.warning(f"Could not write default topology file: {e}")

    def _find_vboxmanage(self) -> Optional[str]:
        for path in DEFAULT_VBOX_PATHS:
            try:
                res = subprocess.run([path, "--version"], capture_output=True, text=True, timeout=2)
                if res.returncode == 0:
                    return path
            except Exception:
                continue
        return None

    def get_status(self) -> Dict[str, Any]:
        if not self.vbox_bin:
            self.vbox_bin = self._find_vboxmanage()

        if not self.vbox_bin:
            return {
                "installed": False,
                "version": "Not Found",
                "executable_path": None,
                "message": "Oracle VirtualBox not detected. Please install VirtualBox or verify PATH."
            }

        try:
            res = subprocess.run([self.vbox_bin, "--version"], capture_output=True, text=True, timeout=3)
            version = res.stdout.strip() if res.returncode == 0 else "Unknown"
            return {
                "installed": True,
                "version": version,
                "executable_path": self.vbox_bin,
                "message": "Oracle VirtualBox Hypervisor Engine connected and operational."
            }
        except Exception as e:
            return {
                "installed": False,
                "version": "Error",
                "executable_path": self.vbox_bin,
                "message": f"Execution error: {str(e)}"
            }

    def _load_topology(self) -> Dict[str, Any]:
        try:
            if os.path.exists(TOPOLOGY_FILE):
                with open(TOPOLOGY_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Error loading topology: {e}")
        return {"roles": {}, "vms": {}, "lab_bindings": {}}

    def _save_topology(self, data: Dict[str, Any]):
        try:
            with open(TOPOLOGY_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving topology: {e}")

    # ══════════════════════════════════════════════════════════════════════════
    # ─── DYNAMIC IP RESOLUTION (GUEST PROPERTIES, ARP TABLE & DHCP) ───────────
    # ══════════════════════════════════════════════════════════════════════════

    def _get_arp_table(self) -> Dict[str, str]:
        """Read system ARP table mapping lowercase MACs (without colons/hyphens) to IPv4 addresses."""
        arp_map = {}
        try:
            res = subprocess.run(["arp", "-a"], capture_output=True, text=True, timeout=3)
            if res.returncode == 0:
                for line in res.stdout.splitlines():
                    match = re.search(r"(\d{1,3}(?:\.\d{1,3}){3})\s+([0-9a-fA-F:\-]{17})", line)
                    if match:
                        ip_found = match.group(1)
                        mac_clean = re.sub(r"[\-:]", "", match.group(2)).lower()
                        arp_map[mac_clean] = ip_found
        except Exception as e:
            logger.debug(f"ARP table read notice: {e}")
        return arp_map

    def _query_guest_ip(self, uuid_str: str) -> Optional[str]:
        """Scan all guest property network adapters (Net/0 through Net/3) for live guest IPv4."""
        if not self.vbox_bin:
            return None
        try:
            for nic_idx in range(4):
                res = subprocess.run(
                    [self.vbox_bin, "guestproperty", "get", uuid_str, f"/VirtualBox/GuestInfo/Net/{nic_idx}/V4/IP"],
                    capture_output=True, text=True, timeout=2
                )
                if res.returncode == 0 and "Value:" in res.stdout:
                    val = res.stdout.split("Value:")[1].strip()
                    if val and val != "No value set!" and val != "127.0.0.1":
                        return val

            res = subprocess.run([self.vbox_bin, "guestproperty", "enumerate", uuid_str], capture_output=True, text=True, timeout=3)
            if res.returncode == 0:
                match = re.search(r"/VirtualBox/GuestInfo/Net/\d+/V4/IP\s*=\s*'([^']+)'", res.stdout)
                if match:
                    ip_str = match.group(1).strip()
                    if ip_str and ip_str != "127.0.0.1":
                        return ip_str
        except Exception:
            pass
        return None

    # ══════════════════════════════════════════════════════════════════════════
    # ─── VM INVENTORY & DETAILS ───────────────────────────────────────────────
    # ══════════════════════════════════════════════════════════════════════════

    def list_vms(self) -> List[Dict[str, Any]]:
        """List all VMs registered in VirtualBox with metadata, multi-NIC info, and dynamic IP."""
        if not self.vbox_bin:
            return []

        topology = self._load_topology()
        roles_map = topology.get("roles", {})
        saved_vms = topology.get("vms", {})
        arp_cache = self._get_arp_table()

        vms = []
        try:
            running_res = subprocess.run([self.vbox_bin, "list", "runningvms"], capture_output=True, text=True, timeout=5)
            running_names = set(re.findall(r'"([^"]+)"', running_res.stdout))

            all_res = subprocess.run([self.vbox_bin, "list", "vms"], capture_output=True, text=True, timeout=5)
            matches = re.findall(r'"([^"]+)"\s+\{([^}]+)\}', all_res.stdout)

            for name, uuid_str in matches:
                is_running = name in running_names
                vm_info = self._get_vm_details(uuid_str, name, is_running, arp_cache)

                role_info = roles_map.get(name) or saved_vms.get(uuid_str, {})
                if role_info:
                    vm_info["assigned_role"] = role_info.get("role", vm_info["assigned_role"])
                    vm_info["target_labs"] = role_info.get("target_labs", vm_info.get("target_labs", []))
                    if role_info.get("ip") and not vm_info.get("ip_address"):
                        vm_info["ip_address"] = role_info.get("ip")

                vms.append(vm_info)
        except Exception as e:
            logger.error(f"Error listing VirtualBox VMs: {e}")

        return vms

    def _get_vm_details(self, uuid_str: str, name: str, is_running: bool, arp_cache: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Query detailed machinereadable info, NICs, and dynamic guest properties."""
        details = {
            "uuid": uuid_str,
            "name": name,
            "status": "running" if is_running else "poweroff",
            "os_type": "Unknown",
            "memory_mb": 1024,
            "cpus": 1,
            "ip_address": None,
            "mac_address": None,
            "nic_type": "nat",
            "cable_connected": True,
            "adapters": [],
            "assigned_role": self._infer_default_role(name),
            "target_labs": self._infer_target_labs(name),
            "last_updated": datetime.utcnow().isoformat() + "Z"
        }

        macs = []
        try:
            res = subprocess.run([self.vbox_bin, "showvminfo", uuid_str, "--machinereadable"], capture_output=True, text=True, timeout=4)
            if res.returncode == 0:
                lines = res.stdout.splitlines()
                adapters = {}
                for line in lines:
                    if line.startswith("ostype="):
                        details["os_type"] = line.split("=", 1)[1].strip('"')
                    elif line.startswith("memory="):
                        details["memory_mb"] = int(line.split("=", 1)[1])
                    elif line.startswith("cpus="):
                        details["cpus"] = int(line.split("=", 1)[1])
                    elif line.startswith("VMState="):
                        details["status"] = line.split("=", 1)[1].strip('"')

                    m_nic = re.match(r'nic(\d+)="([^"]+)"', line)
                    if m_nic:
                        idx = int(m_nic.group(1))
                        adapters.setdefault(idx, {})["index"] = idx
                        adapters[idx]["mode"] = m_nic.group(2)

                    m_mac = re.match(r'macaddress(\d+)="([^"]+)"', line)
                    if m_mac:
                        idx = int(m_mac.group(1))
                        raw = m_mac.group(2).strip('"')
                        fmt = ":".join(raw[i:i+2] for i in range(0, len(raw), 2))
                        adapters.setdefault(idx, {})["mac"] = fmt
                        adapters[idx]["raw_mac"] = raw.lower()
                        macs.append(raw.lower())

                    m_cable = re.match(r'cableconnected(\d+)="([^"]+)"', line)
                    if m_cable:
                        idx = int(m_cable.group(1))
                        adapters.setdefault(idx, {})["cable"] = (m_cable.group(2).lower() == "on")

                if 1 in adapters:
                    details["nic_type"] = adapters[1].get("mode", "nat")
                    details["mac_address"] = adapters[1].get("mac")
                    details["cable_connected"] = adapters[1].get("cable", True)

                details["adapters"] = [adapters[k] for k in sorted(adapters.keys())]
        except Exception as e:
            logger.debug(f"Details error for {name}: {e}")

        if details["status"] == "running":
            guest_ip = self._query_guest_ip(uuid_str)
            if guest_ip:
                details["ip_address"] = guest_ip

        if not details["ip_address"] and arp_cache:
            for m in macs:
                if m in arp_cache:
                    details["ip_address"] = arp_cache[m]
                    break

        return details

    def _infer_default_role(self, name: str) -> str:
        nl = name.lower()
        if "pfsense" in nl or "firewall" in nl:
            return "pfSense Perimeter Gateway"
        if "kali" in nl or "parrot" in nl or "attack" in nl:
            return "SOC Analyst / Red Attacker"
        if "metasploit" in nl or "vuln" in nl or "target" in nl:
            return "Vulnerable Target Web & DB Server"
        if "win" in nl or "workstation" in nl or "endpoint" in nl:
            return "Corporate Windows / Linux Endpoint"
        return "General Lab Virtual Machine"

    def _infer_target_labs(self, name: str) -> List[str]:
        nl = name.lower()
        if "pfsense" in nl or "firewall" in nl:
            return ["L14", "L19", "L26", "L32"]
        if "kali" in nl or "attack" in nl:
            return ["L08", "L10", "L16", "L20", "L35", "L38", "L40"]
        if "metasploit" in nl or "vuln" in nl:
            return ["L21", "L22", "L27", "L36"]
        if "win" in nl or "workstation" in nl:
            return ["L01", "L02", "L06", "L30", "L31", "L40"]
        return ["L01", "L09", "L10"]

    # ══════════════════════════════════════════════════════════════════════════
    # ─── VM LIFECYCLE & EXECUTION (GUI, HEADLESS, SEPARATE, SAVESTATE) ───────
    # ══════════════════════════════════════════════════════════════════════════

    def start_vm(self, vm_id: str, mode: str = "gui") -> Dict[str, Any]:
        """Start a VirtualBox VM in GUI, Headless, or Separate (Detachable) mode."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        mode_clean = mode.lower()
        if mode_clean not in ["gui", "headless", "separate"]:
            mode_clean = "gui"

        # Ensure GUI window is placed onto the primary monitor (100, 100) and not an offscreen phantom monitor
        if mode_clean == "gui":
            try:
                subprocess.run([self.vbox_bin, "setextradata", vm_id, "GUI/LastNormalWindowPosition", "100,100,1024,768"], capture_output=True, timeout=5)
            except Exception as pos_err:
                logger.debug(f"Could not set window position: {pos_err}")

        try:
            res = subprocess.run([self.vbox_bin, "startvm", vm_id, "--type", mode_clean], capture_output=True, text=True, timeout=15)
            if res.returncode == 0 or "already locked" in res.stderr:
                return {"status": "ok", "message": f"VM '{vm_id}' started in {mode_clean} mode.", "output": res.stdout.strip()}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def control_vm(self, vm_id: str, action: str) -> Dict[str, Any]:
        """Control VM state: savestate, pause, resume, poweroff, acpipowerbutton, reset."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        action_clean = action.lower()
        valid_actions = ["savestate", "pause", "resume", "poweroff", "acpipowerbutton", "reset"]
        if action_clean not in valid_actions:
            return {"status": "error", "message": f"Invalid action: {action}. Valid: {valid_actions}"}

        try:
            res = subprocess.run([self.vbox_bin, "controlvm", vm_id, action_clean], capture_output=True, text=True, timeout=12)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Action '{action_clean}' sent to VM '{vm_id}'."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    # ══════════════════════════════════════════════════════════════════════════
    # ─── SNAPSHOT MANAGEMENT (LIST, TAKE, RESTORE, DELETE) ───────────────────
    # ══════════════════════════════════════════════════════════════════════════

    def list_snapshots(self, vm_id: str) -> List[Dict[str, Any]]:
        """Return all snapshots for a VM with name, UUID, description, and current state."""
        if not self.vbox_bin:
            return []

        snapshots = []
        try:
            res = subprocess.run([self.vbox_bin, "snapshot", vm_id, "list", "--machinereadable"], capture_output=True, text=True, timeout=8)
            if res.returncode == 0:
                curr_snap = None
                m_curr = re.search(r'CurrentSnapshotName="([^"]+)"', res.stdout)
                if m_curr:
                    curr_snap = m_curr.group(1)

                snap_names = re.findall(r'SnapshotName(?:-\d+)?="([^"]+)"', res.stdout)
                snap_uuids = re.findall(r'SnapshotUUID(?:-\d+)?="([^"]+)"', res.stdout)
                snap_descs = re.findall(r'SnapshotDescription(?:-\d+)?="([^"]+)"', res.stdout)

                for i in range(len(snap_names)):
                    name = snap_names[i]
                    uuid_val = snap_uuids[i] if i < len(snap_uuids) else ""
                    desc_val = snap_descs[i] if i < len(snap_descs) else ""
                    snapshots.append({
                        "name": name,
                        "uuid": uuid_val,
                        "description": desc_val,
                        "is_current": (name == curr_snap)
                    })
        except Exception as e:
            logger.error(f"Error listing snapshots for {vm_id}: {e}")
        return snapshots

    def take_snapshot(self, vm_id: str, snapshot_name: str, description: str = "") -> Dict[str, Any]:
        """Capture a snapshot of a VM for clean lab resets."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        if not snapshot_name:
            snapshot_name = f"ShadowXLab_Snap_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        try:
            cmd = [self.vbox_bin, "snapshot", vm_id, "take", snapshot_name]
            if description:
                cmd.extend(["--description", description])
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Snapshot '{snapshot_name}' created successfully."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def restore_snapshot(self, vm_id: str, snapshot_name: str) -> Dict[str, Any]:
        """Restore a VM to a designated snapshot state."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        try:
            res = subprocess.run([self.vbox_bin, "snapshot", vm_id, "restore", snapshot_name], capture_output=True, text=True, timeout=30)
            if res.returncode == 0:
                return {"status": "ok", "message": f"VM '{vm_id}' restored to snapshot '{snapshot_name}'."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def delete_snapshot(self, vm_id: str, snapshot_name: str) -> Dict[str, Any]:
        """Delete / merge a snapshot."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        try:
            res = subprocess.run([self.vbox_bin, "snapshot", vm_id, "delete", snapshot_name], capture_output=True, text=True, timeout=45)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Snapshot '{snapshot_name}' deleted."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    # ══════════════════════════════════════════════════════════════════════════
    # ─── VM CLONING (RAPID RANGE PROVISIONING) ────────────────────────────────
    # ══════════════════════════════════════════════════════════════════════════

    def clone_vm(self, vm_id: str, new_name: str, mode: str = "full", snapshot_name: Optional[str] = None) -> Dict[str, Any]:
        """Clone a VM as Full Clone or Linked Clone (requires snapshot)."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        try:
            cmd = [self.vbox_bin, "clonevm", vm_id, "--name", new_name, "--register"]
            if mode.lower() == "linked":
                if snapshot_name:
                    cmd.extend(["--snapshot", snapshot_name, "--options", "link"])
                else:
                    cmd.extend(["--mode", "all", "--options", "link"])
            else:
                cmd.extend(["--mode", "all"])

            res = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            if res.returncode == 0:
                return {"status": "ok", "message": f"VM cloned as '{new_name}' ({mode} mode)."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    # ══════════════════════════════════════════════════════════════════════════
    # ─── NETWORK ADAPTER & CABLE SIMULATION ───────────────────────────────────
    # ══════════════════════════════════════════════════════════════════════════

    def get_vm_adapters(self, vm_id: str) -> List[Dict[str, Any]]:
        """Get full configuration of all 4 network adapters on the VM."""
        if not self.vbox_bin:
            return []

        adapters = []
        try:
            res = subprocess.run([self.vbox_bin, "showvminfo", vm_id, "--machinereadable"], capture_output=True, text=True, timeout=4)
            if res.returncode == 0:
                raw = res.stdout
                for i in range(1, 5):
                    m_nic = re.search(fr'nic{i}="([^"]+)"', raw)
                    if m_nic and m_nic.group(1) != "none":
                        mode = m_nic.group(1)
                        m_mac = re.search(fr'macaddress{i}="([^"]+)"', raw)
                        mac = m_mac.group(1) if m_mac else "unknown"
                        m_cable = re.search(fr'cableconnected{i}="([^"]+)"', raw)
                        cable = (m_cable.group(1).lower() == "on") if m_cable else True
                        m_net = re.search(fr'(?:hostonlyadapter|bridgeadapter|intnet|natnet){i}="([^"]+)"', raw)
                        net_name = m_net.group(1) if m_net else "Default"
                        adapters.append({
                            "index": i,
                            "mode": mode,
                            "mac": ":".join(mac[j:j+2] for j in range(0, len(mac), 2)) if len(mac) == 12 else mac,
                            "cable_connected": cable,
                            "network_name": net_name
                        })
        except Exception as e:
            logger.error(f"Error getting adapters for {vm_id}: {e}")
        return adapters

    def set_cable_state(self, vm_id: str, nic_index: int, connected: bool) -> Dict[str, Any]:
        """Simulate connecting or disconnecting the physical network cable (air-gap drill)."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        state_str = "on" if connected else "off"
        try:
            res = subprocess.run([self.vbox_bin, "controlvm", vm_id, f"setlinkstate{nic_index}", state_str], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Adapter {nic_index} cable set to {state_str} (live)."}

            res2 = subprocess.run([self.vbox_bin, "modifyvm", vm_id, f"--cableconnected{nic_index}", state_str], capture_output=True, text=True, timeout=5)
            if res2.returncode == 0:
                return {"status": "ok", "message": f"Adapter {nic_index} cable set to {state_str}."}
            return {"status": "error", "message": res2.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def modify_adapter(self, vm_id: str, nic_index: int, mode: str, network_name: Optional[str] = None) -> Dict[str, Any]:
        """Change adapter mode: nat, bridged, hostonly, intnet, natnetwork."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        mode_clean = mode.lower()
        cmd = [self.vbox_bin, "modifyvm", vm_id, f"--nic{nic_index}", mode_clean]
        if network_name:
            if mode_clean == "bridged":
                cmd.extend([f"--bridgeadapter{nic_index}", network_name])
            elif mode_clean == "hostonly":
                cmd.extend([f"--hostonlyadapter{nic_index}", network_name])
            elif mode_clean == "intnet":
                cmd.extend([f"--intnet{nic_index}", network_name])
            elif mode_clean == "natnetwork":
                cmd.extend([f"--natnet{nic_index}", network_name])

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=8)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Adapter {nic_index} set to {mode_clean}."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def list_port_forwards(self, vm_id: str, nic_index: int = 1) -> List[Dict[str, Any]]:
        """List NAT port forwarding rules configured on the VM."""
        if not self.vbox_bin:
            return []

        rules = []
        try:
            res = subprocess.run([self.vbox_bin, "showvminfo", vm_id, "--machinereadable"], capture_output=True, text=True, timeout=4)
            if res.returncode == 0:
                matches = re.findall(rf'Forwarding\({nic_index}\)="([^,]+),([^,]+),([^,]*),([^,]+),([^,]*),([^,]+)"', res.stdout)
                for name, proto, host_ip, host_port, guest_ip, guest_port in matches:
                    rules.append({
                        "name": name,
                        "proto": proto,
                        "host_ip": host_ip,
                        "host_port": host_port,
                        "guest_ip": guest_ip,
                        "guest_port": guest_port
                    })
        except Exception as e:
            logger.error(f"Error listing port forwards: {e}")
        return rules

    def add_port_forward(self, vm_id: str, nic_index: int, name: str, proto: str, host_port: int, guest_port: int, host_ip: str = "", guest_ip: str = "") -> Dict[str, Any]:
        """Add a NAT port forwarding rule (works on running VM or offline)."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        rule_spec = f"{name},{proto.lower()},{host_ip},{host_port},{guest_ip},{guest_port}"
        try:
            res = subprocess.run([self.vbox_bin, "controlvm", vm_id, f"natpf{nic_index}", rule_spec], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Port forward rule '{name}' added (live)."}

            res2 = subprocess.run([self.vbox_bin, "modifyvm", vm_id, f"--natpf{nic_index}", rule_spec], capture_output=True, text=True, timeout=5)
            if res2.returncode == 0:
                return {"status": "ok", "message": f"Port forward rule '{name}' added."}
            return {"status": "error", "message": res2.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def delete_port_forward(self, vm_id: str, nic_index: int, name: str) -> Dict[str, Any]:
        """Remove a NAT port forwarding rule."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        try:
            res = subprocess.run([self.vbox_bin, "controlvm", vm_id, f"natpf{nic_index}", "delete", name], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Rule '{name}' deleted (live)."}
            res2 = subprocess.run([self.vbox_bin, "modifyvm", vm_id, f"--natpf{nic_index}", "delete", name], capture_output=True, text=True, timeout=5)
            if res2.returncode == 0:
                return {"status": "ok", "message": f"Rule '{name}' deleted."}
            return {"status": "error", "message": res2.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    # ══════════════════════════════════════════════════════════════════════════
    # ─── GUEST CONTROL EXECUTION & SCRIPT RUNNER ──────────────────────────────
    # ══════════════════════════════════════════════════════════════════════════

    def exec_guest_command(self, vm_id: str, username: str, password: str, command: str, args: Optional[List[str]] = None) -> Dict[str, Any]:
        """Execute a command directly inside the guest OS without SSH via VBoxManage guestcontrol."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        cmd = [
            self.vbox_bin, "guestcontrol", vm_id, "run",
            "--username", username,
            "--password", password,
            "--exe", command,
            "--wait-stdout", "--wait-stderr"
        ]
        if args:
            cmd.extend(["--"] + args)

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
            return {
                "status": "ok" if res.returncode == 0 else "error",
                "exit_code": res.returncode,
                "stdout": res.stdout.strip(),
                "stderr": res.stderr.strip()
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    # ══════════════════════════════════════════════════════════════════════════
    # ─── HOST NETWORKS & HYPERVISOR ENVIRONMENT ───────────────────────────────
    # ══════════════════════════════════════════════════════════════════════════

    def list_host_interfaces(self) -> List[Dict[str, Any]]:
        """List VirtualBox Host-Only interfaces with IP, mask, and status."""
        if not self.vbox_bin:
            return []

        interfaces = []
        try:
            res = subprocess.run([self.vbox_bin, "list", "hostonlyifs"], capture_output=True, text=True, timeout=4)
            if res.returncode == 0:
                blocks = res.stdout.strip().split("\n\n")
                for block in blocks:
                    if not block.strip():
                        continue
                    name_m = re.search(r"Name:\s+(.+)", block)
                    ip_m = re.search(r"IPAddress:\s+(.+)", block)
                    mask_m = re.search(r"NetworkMask:\s+(.+)", block)
                    dhcp_m = re.search(r"DHCP:\s+(.+)", block)
                    status_m = re.search(r"Status:\s+(.+)", block)
                    if name_m:
                        interfaces.append({
                            "name": name_m.group(1).strip(),
                            "ip": ip_m.group(1).strip() if ip_m else "N/A",
                            "mask": mask_m.group(1).strip() if mask_m else "N/A",
                            "dhcp": dhcp_m.group(1).strip() if dhcp_m else "Disabled",
                            "status": status_m.group(1).strip() if status_m else "Up"
                        })
        except Exception as e:
            logger.error(f"Error listing host interfaces: {e}")
        return interfaces

    def list_nat_networks(self) -> List[Dict[str, Any]]:
        """List all VirtualBox NatNetworks with subnet, gateway, and DHCP status."""
        if not self.vbox_bin:
            return []

        nets = []
        try:
            res = subprocess.run([self.vbox_bin, "natnetwork", "list"], capture_output=True, text=True, timeout=4)
            if res.returncode == 0:
                blocks = res.stdout.strip().split("\n\n")
                for block in blocks:
                    if not block.strip():
                        continue
                    name_m = re.search(r"Name:\s+(.+)", block)
                    net_m = re.search(r"Network:\s+(.+)", block)
                    gw_m = re.search(r"Gateway:\s+(.+)", block)
                    dhcp_m = re.search(r"DHCP Server:\s+(.+)", block)
                    if name_m:
                        nets.append({
                            "name": name_m.group(1).strip(),
                            "network": net_m.group(1).strip() if net_m else "N/A",
                            "gateway": gw_m.group(1).strip() if gw_m else "N/A",
                            "dhcp": dhcp_m.group(1).strip() if dhcp_m else "No"
                        })
        except Exception as e:
            logger.error(f"Error listing NAT networks: {e}")
        return nets

    def list_dhcp_servers(self) -> List[Dict[str, Any]]:
        """List VirtualBox DHCP servers and IP lease pools."""
        if not self.vbox_bin:
            return []

        servers = []
        try:
            res = subprocess.run([self.vbox_bin, "list", "dhcpservers"], capture_output=True, text=True, timeout=4)
            if res.returncode == 0:
                blocks = res.stdout.strip().split("\n\n")
                for block in blocks:
                    if not block.strip():
                        continue
                    net_m = re.search(r"NetworkName:\s+(.+)", block)
                    ip_m = re.search(r"Dhcpd IP:\s+(.+)", block)
                    lower_m = re.search(r"LowerIPAddress:\s+(.+)", block)
                    upper_m = re.search(r"UpperIPAddress:\s+(.+)", block)
                    enabled_m = re.search(r"Enabled:\s+(.+)", block)
                    if net_m:
                        servers.append({
                            "network_name": net_m.group(1).strip(),
                            "server_ip": ip_m.group(1).strip() if ip_m else "N/A",
                            "pool_start": lower_m.group(1).strip() if lower_m else "N/A",
                            "pool_end": upper_m.group(1).strip() if upper_m else "N/A",
                            "enabled": enabled_m.group(1).strip() if enabled_m else "No"
                        })
        except Exception as e:
            logger.error(f"Error listing DHCP servers: {e}")
        return servers

    # ══════════════════════════════════════════════════════════════════════════
    # ─── LAB BINDINGS & DYNAMIC VM IP REPLACEMENT MATRIX ─────────────────────
    # ══════════════════════════════════════════════════════════════════════════

    def get_lab_bindings(self) -> Dict[str, Any]:
        """Return dynamic mapping between SOC Labs (L01-L40) and VirtualBox VM IPs."""
        topo = self._load_topology()
        return topo.get("lab_bindings", {})

    def save_lab_binding(self, lab_id: str, vm_uuid: Optional[str], custom_ip: Optional[str], custom_name: Optional[str]) -> Dict[str, Any]:
        """Bind a specific VirtualBox VM or Custom IP to a SOC Lab."""
        topo = self._load_topology()
        bindings = topo.setdefault("lab_bindings", {})
        bindings[lab_id] = {
            "lab_id": lab_id,
            "vm_uuid": vm_uuid,
            "ip": custom_ip,
            "name": custom_name,
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }
        self._save_topology(topo)
        return {"status": "ok", "binding": bindings[lab_id]}

    def auto_bind_detected_vms(self) -> Dict[str, Any]:
        """Automatically map detected VirtualBox VMs to matching Foundation Track labs."""
        vms = self.list_vms()
        topo = self._load_topology()
        bindings = topo.setdefault("lab_bindings", {})

        for vm in vms:
            name_lower = vm["name"].lower()
            ip = vm.get("ip_address") or ("192.168.1.33" if "kali" in name_lower else "10.10.20.1" if "pfsense" in name_lower else "10.10.20.15" if "meta" in name_lower else "10.10.20.44")

            if "pfsense" in name_lower or "firewall" in name_lower:
                for l in ["L14", "L19", "L26", "L32"]:
                    bindings[l] = {"lab_id": l, "vm_uuid": vm["uuid"], "ip": ip, "name": vm["name"]}
            elif "kali" in name_lower or "attack" in name_lower:
                for l in ["L08", "L10", "L16", "L20", "L35", "L38", "L40"]:
                    bindings[l] = {"lab_id": l, "vm_uuid": vm["uuid"], "ip": ip, "name": vm["name"]}
            elif "meta" in name_lower or "vuln" in name_lower:
                for l in ["L21", "L22", "L27", "L36"]:
                    bindings[l] = {"lab_id": l, "vm_uuid": vm["uuid"], "ip": ip, "name": vm["name"]}
            elif "labvm" in name_lower or "win" in name_lower or "workstation" in name_lower:
                for l in ["L01", "L02", "L06", "L30", "L31", "L40"]:
                    bindings[l] = {"lab_id": l, "vm_uuid": vm["uuid"], "ip": ip, "name": vm["name"]}

        self._save_topology(topo)
        return {"status": "ok", "bound_count": len(bindings), "bindings": bindings}

    def set_vm_role(self, uuid_str: str, name: str, role: str, ip: Optional[str], target_labs: List[Any]) -> Dict[str, Any]:
        """Assign role and network identity to a VM in the active lab range."""
        topology = self._load_topology()
        topology.setdefault("roles", {})[name] = {
            "role": role,
            "ip": ip,
            "target_labs": target_labs,
            "uuid": uuid_str,
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }
        topology.setdefault("vms", {})[uuid_str] = {
            "name": name,
            "role": role,
            "ip": ip,
            "target_labs": target_labs
        }
        self._save_topology(topology)
        return {"status": "ok", "vm": name, "role": role, "ip": ip}

    def test_connectivity(self, ip: str, port: Optional[int] = None) -> Dict[str, Any]:
        """Test live ping latency and optional TCP port reachability against real VM."""
        ip = ip.strip()
        if not ip:
            return {"status": "error", "message": "IP address is required."}

        ping_ok = False
        latency_ms = None
        try:
            ping_cmd = ["ping", "-n", "2", "-w", "1000", ip] if os.name == "nt" else ["ping", "-c", "2", "-W", "1", ip]
            res = subprocess.run(ping_cmd, capture_output=True, text=True, timeout=4)
            ping_ok = (res.returncode == 0)
            if ping_ok:
                match = re.search(r"time[=<](\d+(?:\.\d+)?)ms", res.stdout, re.IGNORECASE)
                if match:
                    latency_ms = float(match.group(1))
        except Exception as e:
            logger.warning(f"Ping exception for {ip}: {e}")

        port_open = False
        if port:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(1.5)
                res_code = s.connect_ex((ip, int(port)))
                port_open = (res_code == 0)
                s.close()
            except Exception:
                port_open = False

        return {
            "ip": ip,
            "ping_ok": ping_ok,
            "latency_ms": latency_ms,
            "port": port,
            "port_open": port_open if port else None,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }


    # ══════════════════════════════════════════════════════════════════════════
    # ─── EXTENDED MACHINE SETTINGS, LOGS, SCREENSHOT & MEDIA CONTROLS ─────────
    # ══════════════════════════════════════════════════════════════════════════

    def get_vm_extended_info(self, vm_id: str) -> Dict[str, Any]:
        """Fetch complete VirtualBox settings: RAM, CPU, VRAM, Graphics, Boot order, Paths."""
        if not self.vbox_bin:
            return {}

        info = {
            "uuid": vm_id,
            "memory_mb": 1024,
            "cpus": 1,
            "vram_mb": 16,
            "graphics_controller": "vmsvga",
            "accelerate3d": False,
            "boot_order": ["disk", "dvd", "net"],
            "cfg_file": "",
            "log_folder": "",
            "optical_drive": None,
            "optical_attached": "emptydrive",
            "storage_controllers": []
        }

        try:
            res = subprocess.run([self.vbox_bin, "showvminfo", vm_id, "--machinereadable"], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                raw = res.stdout
                for line in raw.splitlines():
                    if line.startswith("memory="):
                        info["memory_mb"] = int(line.split("=", 1)[1])
                    elif line.startswith("cpus="):
                        info["cpus"] = int(line.split("=", 1)[1])
                    elif line.startswith("vram="):
                        info["vram_mb"] = int(line.split("=", 1)[1])
                    elif line.startswith("graphicscontroller="):
                        info["graphics_controller"] = line.split("=", 1)[1].strip('"')
                    elif line.startswith("accelerate3d="):
                        info["accelerate3d"] = (line.split("=", 1)[1].strip('"').lower() == "on")
                    elif line.startswith("CfgFile="):
                        info["cfg_file"] = line.split("=", 1)[1].strip('"')
                    elif line.startswith("LogFolder="):
                        info["log_folder"] = line.split("=", 1)[1].strip('"')

                # Boot order
                boot_items = []
                for b_idx in range(1, 5):
                    m_boot = re.search(fr'boot{b_idx}="([^"]+)"', raw)
                    if m_boot and m_boot.group(1) != "none":
                        boot_items.append(m_boot.group(1))
                if boot_items:
                    info["boot_order"] = boot_items

                # Optical drive detection (IDE or SATA)
                m_opt = re.search(r'"(IDE|SATA)-(\d+)-(\d+)"="([^"]+)"', raw)
                if m_opt:
                    info["optical_drive"] = {
                        "controller": m_opt.group(1),
                        "port": int(m_opt.group(2)),
                        "device": int(m_opt.group(3))
                    }
                    info["optical_attached"] = m_opt.group(4)
        except Exception as e:
            logger.error(f"Error getting extended info for {vm_id}: {e}")

        return info

    def update_vm_settings(self, vm_id: str, memory_mb: Optional[int] = None, cpus: Optional[int] = None,
                           vram_mb: Optional[int] = None, graphics_controller: Optional[str] = None,
                           boot1: Optional[str] = None, boot2: Optional[str] = None, boot3: Optional[str] = None) -> Dict[str, Any]:
        """Modify hardware settings (RAM, CPUs, VRAM, Graphics, Boot) on poweroff VM."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        cmd = [self.vbox_bin, "modifyvm", vm_id]
        if memory_mb is not None:
            cmd.extend(["--memory", str(memory_mb)])
        if cpus is not None:
            cmd.extend(["--cpus", str(cpus)])
        if vram_mb is not None:
            cmd.extend(["--vram", str(vram_mb)])
        if graphics_controller:
            cmd.extend(["--graphicscontroller", graphics_controller])
        if boot1:
            cmd.extend(["--boot1", boot1])
        if boot2:
            cmd.extend(["--boot2", boot2])
        if boot3:
            cmd.extend(["--boot3", boot3])

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Hardware settings updated for '{vm_id}'."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def discard_saved_state(self, vm_id: str) -> Dict[str, Any]:
        """Discard saved state of a VM to return it to poweroff state."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        try:
            res = subprocess.run([self.vbox_bin, "discardstate", vm_id], capture_output=True, text=True, timeout=15)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Saved state discarded for '{vm_id}'."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def send_keys(self, vm_id: str, combo: str = "ctrl-alt-del") -> Dict[str, Any]:
        """Send keyboard scancodes to a running VM (e.g. Ctrl+Alt+Del)."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        # Scancodes for Ctrl+Alt+Del press and release:
        # 1d (Ctrl press), 38 (Alt press), 53 (Del press), d3 (Del release), b8 (Alt release), 9d (Ctrl release)
        scancodes = ["1d", "38", "53", "d3", "b8", "9d"]
        try:
            cmd = [self.vbox_bin, "controlvm", vm_id, "keyboardputscancode"] + scancodes
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Sent '{combo}' to VM '{vm_id}'."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def take_screenshot(self, vm_id: str) -> Dict[str, Any]:
        """Capture a live PNG screenshot of the running VM display and return as base64 data URL."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        import tempfile
        import base64

        tmp_png = os.path.join(tempfile.gettempdir(), f"vbox_shot_{os.getpid()}_{datetime.now().strftime('%H%M%S')}.png")
        try:
            res = subprocess.run([self.vbox_bin, "controlvm", vm_id, "screenshotpng", tmp_png], capture_output=True, text=True, timeout=8)
            if res.returncode == 0 and os.path.exists(tmp_png):
                with open(tmp_png, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode("utf-8")
                try:
                    os.remove(tmp_png)
                except Exception:
                    pass
                return {
                    "status": "ok",
                    "image_data": f"data:image/png;base64,{b64}",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            return {"status": "error", "message": res.stderr.strip() or "Failed to capture screenshot. VM may be powered off."}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_vm_logs(self, vm_id: str, max_lines: int = 200) -> Dict[str, Any]:
        """Read recent log entries from VBox.log for this VM."""
        ext = self.get_vm_extended_info(vm_id)
        log_folder = ext.get("log_folder")
        if not log_folder and ext.get("cfg_file"):
            log_folder = os.path.join(os.path.dirname(ext["cfg_file"]), "Logs")

        if not log_folder or not os.path.exists(log_folder):
            # Try default VirtualBox VMs path
            default_user_dir = os.path.expanduser("~")
            log_folder = os.path.join(default_user_dir, "VirtualBox VMs", vm_id, "Logs")

        log_file = os.path.join(log_folder, "VBox.log")
        if not os.path.exists(log_file):
            return {"status": "error", "message": f"Log file not found at {log_file}."}

        try:
            with open(log_file, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
            return {
                "status": "ok",
                "file": log_file,
                "total_lines": len(lines),
                "lines": [l.rstrip() for l in lines[-max_lines:]]
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def open_vm_folder(self, vm_id: str) -> Dict[str, Any]:
        """Open the VM directory in Windows Explorer."""
        ext = self.get_vm_extended_info(vm_id)
        cfg_file = ext.get("cfg_file")
        if cfg_file and os.path.exists(cfg_file):
            folder = os.path.dirname(cfg_file)
            try:
                subprocess.Popen(["explorer.exe", folder])
                return {"status": "ok", "message": f"Opened folder: {folder}"}
            except Exception as e:
                return {"status": "error", "message": str(e)}
        return {"status": "error", "message": "VM configuration directory not found."}

    def mount_guest_additions(self, vm_id: str) -> Dict[str, Any]:
        """Mount VBoxGuestAdditions.iso into the VM optical drive."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        # Locate GuestAdditions ISO
        iso_candidates = [
            os.path.join(os.path.dirname(self.vbox_bin), "VBoxGuestAdditions.iso"),
            r"C:\Program Files\Oracle\VirtualBox\VBoxGuestAdditions.iso",
            r"C:\Program Files (x86)\Oracle\VirtualBox\VBoxGuestAdditions.iso",
        ]
        iso_path = None
        for p in iso_candidates:
            if os.path.exists(p):
                iso_path = p
                break

        if not iso_path:
            iso_path = "additions"

        return self.mount_iso(vm_id, iso_path)

    def mount_iso(self, vm_id: str, iso_path: str) -> Dict[str, Any]:
        """Mount an ISO image or additions to the optical drive."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        ext = self.get_vm_extended_info(vm_id)
        ctrl_name = "IDE"
        port = 1
        device = 0
        if ext.get("optical_drive"):
            ctrl_name = ext["optical_drive"]["controller"]
            port = ext["optical_drive"]["port"]
            device = ext["optical_drive"]["device"]

        try:
            cmd = [
                self.vbox_bin, "storageattach", vm_id,
                "--storagectl", ctrl_name,
                "--port", str(port),
                "--device", str(device),
                "--type", "dvddrive",
                "--medium", iso_path
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Mounted '{iso_path}' to optical drive ({ctrl_name}:{port})."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def eject_iso(self, vm_id: str) -> Dict[str, Any]:
        """Eject optical drive medium."""
        return self.mount_iso(vm_id, "emptydrive")

    def export_ova(self, vm_id: str, output_path: Optional[str] = None) -> Dict[str, Any]:
        """Export VM to an OVA appliance file."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        if not output_path:
            downloads = os.path.join(os.path.expanduser("~"), "Downloads")
            clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', vm_id)
            output_path = os.path.join(downloads, f"{clean_name}_ShadowXLab.ova")

        try:
            cmd = [self.vbox_bin, "export", vm_id, "--output", output_path]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Exported OVA to: {output_path}", "file": output_path}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def remove_vm(self, vm_id: str, delete_files: bool = False) -> Dict[str, Any]:
        """Unregister VM from VirtualBox with optional file deletion."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        cmd = [self.vbox_bin, "unregistervm", vm_id]
        if delete_files:
            cmd.append("--delete")

        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
            if res.returncode == 0:
                return {"status": "ok", "message": f"VM '{vm_id}' unregistered successfully."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

vbox_manager = VirtualBoxManager()
