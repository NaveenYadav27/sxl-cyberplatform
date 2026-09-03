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
    """Enterprise VirtualBox Hypervisor Engine for ShadowXLab."""

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
                    "pfsense vm": {"role": "pfSense Perimeter Gateway", "target_labs": [19, 28, 45], "ip": "10.10.20.1"},
                    "kali linux": {"role": "SOC Analyst / Attacker", "target_labs": [20, 21, 22, 23, 24, 25, 26, 27], "ip": "192.168.1.33"},
                    "Metasploitable VM": {"role": "Vulnerable Target Web Server", "target_labs": [20, 21, 24, 25, 27], "ip": "10.10.20.15"},
                    "Cybersecurity LabVM Worksation 20250409": {"role": "Corporate Windows / Linux Endpoint", "target_labs": [1, 2, 5, 40], "ip": "10.10.20.44"}
                }
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
            # Re-check in case it was installed or path changed
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
        return {"roles": {}, "vms": {}}

    def _save_topology(self, data: Dict[str, Any]):
        try:
            with open(TOPOLOGY_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving topology: {e}")

    def list_vms(self) -> List[Dict[str, Any]]:
        """List all VMs registered in VirtualBox with metadata and live status."""
        if not self.vbox_bin:
            return []

        topology = self._load_topology()
        roles_map = topology.get("roles", {})
        saved_vms = topology.get("vms", {})

        vms = []
        try:
            # 1. Get running VM names
            running_res = subprocess.run([self.vbox_bin, "list", "runningvms"], capture_output=True, text=True, timeout=5)
            running_names = set(re.findall(r'"([^"]+)"', running_res.stdout))

            # 2. Get all VM names & UUIDs
            all_res = subprocess.run([self.vbox_bin, "list", "vms"], capture_output=True, text=True, timeout=5)
            matches = re.findall(r'"([^"]+)"\s+\{([^}]+)\}', all_res.stdout)

            for name, uuid_str in matches:
                is_running = name in running_names
                vm_info = self._get_vm_details(uuid_str, name, is_running)

                # Overlay role mapping if exists
                role_info = roles_map.get(name) or saved_vms.get(uuid_str, {})
                if role_info:
                    vm_info["assigned_role"] = role_info.get("role", vm_info["assigned_role"])
                    vm_info["target_labs"] = role_info.get("target_labs", vm_info.get("target_labs", []))
                    if role_info.get("ip"):
                        vm_info["ip_address"] = role_info.get("ip")

                vms.append(vm_info)
        except Exception as e:
            logger.error(f"Error listing VirtualBox VMs: {e}")

        return vms

    def _get_vm_details(self, uuid_str: str, name: str, is_running: bool) -> Dict[str, Any]:
        """Query detailed machinereadable info and guest properties."""
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
            "assigned_role": self._infer_default_role(name),
            "target_labs": self._infer_target_labs(name),
            "last_updated": datetime.utcnow().isoformat() + "Z"
        }

        try:
            res = subprocess.run([self.vbox_bin, "showvminfo", uuid_str, "--machinereadable"], capture_output=True, text=True, timeout=4)
            if res.returncode == 0:
                for line in res.stdout.splitlines():
                    if line.startswith("ostype="):
                        details["os_type"] = line.split("=", 1)[1].strip('"')
                    elif line.startswith("memory="):
                        details["memory_mb"] = int(line.split("=", 1)[1])
                    elif line.startswith("cpus="):
                        details["cpus"] = int(line.split("=", 1)[1])
                    elif line.startswith("VMState="):
                        details["status"] = line.split("=", 1)[1].strip('"')
                    elif line.startswith("macaddress1="):
                        mac_raw = line.split("=", 1)[1].strip('"')
                        if len(mac_raw) == 12:
                            details["mac_address"] = ":".join(mac_raw[i:i+2] for i in range(0, 12, 2))
                    elif line.startswith("nic1="):
                        details["nic_type"] = line.split("=", 1)[1].strip('"')
        except Exception:
            pass

        # Try to resolve guest IPv4 via guest properties if running
        if details["status"] == "running":
            guest_ip = self._query_guest_ip(uuid_str)
            if guest_ip:
                details["ip_address"] = guest_ip

        return details

    def _query_guest_ip(self, uuid_str: str) -> Optional[str]:
        """Attempt to read guest IP reported by VirtualBox Guest Additions."""
        try:
            res = subprocess.run([self.vbox_bin, "guestproperty", "enumerate", uuid_str], capture_output=True, text=True, timeout=3)
            if res.returncode == 0:
                # Match /VirtualBox/GuestInfo/Net/0/V4/IP = '192.168.1.33'
                match = re.search(r"/VirtualBox/GuestInfo/Net/\d+/V4/IP\s*=\s*'([^']+)'", res.stdout)
                if match:
                    return match.group(1)
        except Exception:
            pass
        return None

    def _infer_default_role(self, name: str) -> str:
        nl = name.lower()
        if "pfsense" in nl or "firewall" in nl:
            return "pfSense Perimeter Gateway"
        if "kali" in nl or "parrot" in nl or "attack" in nl:
            return "SOC Analyst / Attacker"
        if "metasploit" in nl or "vuln" in nl or "target" in nl:
            return "Vulnerable Target Web Server"
        if "win" in nl or "workstation" in nl or "endpoint" in nl:
            return "Corporate Windows / Linux Endpoint"
        return "General Lab Virtual Machine"

    def _infer_target_labs(self, name: str) -> List[int]:
        nl = name.lower()
        if "pfsense" in nl or "firewall" in nl:
            return [19, 28, 45]
        if "kali" in nl or "attack" in nl:
            return [20, 21, 22, 23, 24, 25, 26, 27, 33]
        if "metasploit" in nl or "vuln" in nl:
            return [20, 21, 24, 25, 27]
        if "win" in nl or "workstation" in nl:
            return [2, 5, 40]
        return [1, 9, 10]

    def set_vm_role(self, uuid_str: str, name: str, role: str, ip: Optional[str], target_labs: List[int]) -> Dict[str, Any]:
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

    def start_vm(self, vm_id: str, mode: str = "gui") -> Dict[str, Any]:
        """Start a VirtualBox VM with either GUI display or Headless background."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        vm_type = "headless" if mode.lower() == "headless" else "gui"
        try:
            res = subprocess.run([self.vbox_bin, "startvm", vm_id, "--type", vm_type], capture_output=True, text=True, timeout=15)
            if res.returncode == 0 or "already locked" in res.stderr:
                return {"status": "ok", "message": f"VM '{vm_id}' started in {vm_type} mode.", "output": res.stdout.strip()}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def control_vm(self, vm_id: str, action: str) -> Dict[str, Any]:
        """Execute control actions: poweroff, acpipowerbutton, pause, resume, reset."""
        if not self.vbox_bin:
            return {"status": "error", "message": "VirtualBox not found."}

        action = action.lower()
        if action not in ["poweroff", "acpipowerbutton", "pause", "resume", "reset"]:
            return {"status": "error", "message": f"Invalid action: {action}"}

        try:
            res = subprocess.run([self.vbox_bin, "controlvm", vm_id, action], capture_output=True, text=True, timeout=10)
            if res.returncode == 0:
                return {"status": "ok", "message": f"Command '{action}' sent to VM '{vm_id}'."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

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
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
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
            res = subprocess.run([self.vbox_bin, "snapshot", vm_id, "restore", snapshot_name], capture_output=True, text=True, timeout=25)
            if res.returncode == 0:
                return {"status": "ok", "message": f"VM '{vm_id}' restored to snapshot '{snapshot_name}'."}
            return {"status": "error", "message": res.stderr.strip()}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def test_connectivity(self, ip: str, port: Optional[int] = None) -> Dict[str, Any]:
        """Test live ping latency and optional TCP port reachability against real VM."""
        ip = ip.strip()
        if not ip:
            return {"status": "error", "message": "IP address is required."}

        # 1. ICMP Ping Test
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

        # 2. TCP Port Test (if specified)
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

    def detect_active_vms_network(self) -> List[Dict[str, Any]]:
        """
        Deep-detect active running VirtualBox VMs, read their adapter types
        (NAT, Bridged, Host-Only, Internal), inspect guest IPs via guest properties,
        and link them with the cross-network VPN mesh.
        """
        active_vms = []
        if not self.vbox_bin:
            return active_vms

        try:
            # 1. Get running VMs
            res = subprocess.run([self.vbox_bin, "list", "runningvms"], capture_output=True, text=True, timeout=5)
            if res.returncode != 0:
                return active_vms

            running_lines = [l.strip() for l in res.stdout.splitlines() if l.strip()]
            for line in running_lines:
                match = re.match(r'"([^"]+)"\s+\{([a-f0-9\-]+)\}', line, re.IGNORECASE)
                if not match:
                    continue
                name, vm_uuid = match.group(1), match.group(2)

                # 2. Inspect adapter configuration
                info_res = subprocess.run([self.vbox_bin, "showvminfo", vm_uuid, "--machinereadable"], capture_output=True, text=True, timeout=4)
                nic_type = "unknown"
                cable_connected = True
                guest_os = "linux"

                if info_res.returncode == 0:
                    out = info_res.stdout
                    m_nic = re.search(r'nic1="([^"]+)"', out)
                    if m_nic:
                        nic_type = m_nic.group(1)
                    m_ostype = re.search(r'ostype="([^"]+)"', out)
                    if m_ostype:
                        guest_os = "windows" if "win" in m_ostype.group(1).lower() else "linux"

                # 3. Try to read IP reported by Guest Additions
                guest_ip = None
                prop_res = subprocess.run([self.vbox_bin, "guestproperty", "get", vm_uuid, "/VirtualBox/GuestInfo/Net/0/V4/IP"], capture_output=True, text=True, timeout=3)
                if prop_res.returncode == 0 and "Value:" in prop_res.stdout:
                    val = prop_res.stdout.split("Value:")[1].strip()
                    if val and val != "No value set!":
                        guest_ip = val

                # Fallback to topology IP if guest additions not installed
                topo = self._load_topology()
                saved_ip = topo.get("vms", {}).get(name, {}).get("ip") or topo.get("vms", {}).get(vm_uuid, {}).get("ip")
                final_ip = guest_ip or saved_ip or ("192.168.1.33" if "kali" in name.lower() else "10.10.20.1" if "pfsense" in name.lower() else "10.10.20.15" if "meta" in name.lower() else "10.10.20.44")

                # Determine if cross-network bridging is required (NAT or Internal net)
                needs_vpn = nic_type.lower() in ["nat", "intnet", "hostonly", "natnetwork"] or not guest_ip

                active_vms.append({
                    "name": name,
                    "uuid": vm_uuid,
                    "state": "running",
                    "nic_type": nic_type,
                    "detected_ip": final_ip,
                    "os": guest_os,
                    "needs_vpn_mesh": needs_vpn,
                    "cable_connected": cable_connected
                })

            return active_vms
        except Exception as e:
            logger.error(f"Error detecting running VM networks: {e}")
            return active_vms

vbox_manager = VirtualBoxManager()
