import subprocess
import re
import socket
import logging
from typing import Dict, Any, List

logger = logging.getLogger("VBoxHostAgent")

class VirtualBoxHostAgent:
    """
    Host-side agent running on physical machine executing read-only VBoxManage commands.
    Reports VirtualBox version, VM inventory, running state, and MAC addresses.
    """

    def __init__(self):
        self.vboxmanage_bin = "VBoxManage"

    def get_vbox_version(self) -> str:
        try:
            res = subprocess.run([self.vboxmanage_bin, "--version"], capture_output=True, text=True, timeout=3)
            if res.returncode == 0:
                return res.stdout.strip()
        except Exception:
            pass
        return "Unknown"

    def list_vms(self) -> List[Dict[str, Any]]:
        """Queries local VirtualBox installation for VM inventory and running state."""
        vms = []
        try:
            # 1. Get running VM IDs
            running_res = subprocess.run([self.vboxmanage_bin, "list", "runningvms"], capture_output=True, text=True, timeout=5)
            running_names = set(re.findall(r'"([^"]+)"', running_res.stdout))

            # 2. Get all VM IDs
            all_res = subprocess.run([self.vboxmanage_bin, "list", "vms"], capture_output=True, text=True, timeout=5)
            matches = re.findall(r'"([^"]+)"\s+\{([^}]+)\}', all_res.stdout)

            for name, uuid_str in matches:
                is_running = name in running_names
                vms.append({
                    "vmid": uuid_str,
                    "name": name,
                    "hostname": name,
                    "status": "running" if is_running else "stopped",
                    "os": "windows" if "win" in name.lower() or "dc" in name.lower() else "linux",
                    "discovery_source": "vbox_host_agent",
                    "confidence": 0.95,
                    "is_real": True
                })
        except Exception as e:
            logger.warning(f"[-] VBoxManage discovery error: {e}")

        return vms
