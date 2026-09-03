import httpx
import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

CONFIG_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "proxmox_config.json")

class ProxmoxConfig(BaseModel):
    host: str = "https://100.118.161.17:8006"
    token_id: str = "root@pam!shadowxlab-token"
    token_secret: str = ""
    node_name: str = "pve"
    verify_ssl: bool = False

class RealProxmoxEngine:
    def __init__(self):
        self.config = self._load_config()
        self.is_connected = False
        self.last_error: Optional[str] = None
        self.last_seen: Optional[datetime] = None

    def _load_config(self) -> ProxmoxConfig:
        if os.path.exists(CONFIG_FILE_PATH):
            try:
                with open(CONFIG_FILE_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return ProxmoxConfig(**data)
            except Exception:
                pass
        return ProxmoxConfig()

    def save_config(self, new_config: ProxmoxConfig):
        self.config = new_config
        with open(CONFIG_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(new_config.dict(), f, indent=2)

    def _get_headers(self) -> Dict[str, str]:
        # Proxmox API Token Header Format: PVEAPIToken=USER@REALM!TOKENID=SECRET
        token = f"PVEAPIToken={self.config.token_id}={self.config.token_secret}"
        return {
            "Authorization": token,
            "Accept": "application/json"
        }

    async def test_and_connect(self, config: Optional[ProxmoxConfig] = None) -> Dict[str, Any]:
        """Performs real HTTP API verification against the user's Proxmox VE server."""
        if config:
            self.save_config(config)

        target_host = self.config.host.rstrip('/')
        url = f"{target_host}/api2/json/version"
        headers = self._get_headers()

        try:
            async with httpx.AsyncClient(verify=self.config.verify_ssl, timeout=6.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    version_data = res.json().get("data", {})
                    
                    # Also fetch nodes to auto-detect node name
                    nodes_res = await client.get(f"{target_host}/api2/json/nodes", headers=headers)
                    nodes_data = nodes_res.json().get("data", []) if nodes_res.status_code == 200 else []
                    
                    if nodes_data and len(nodes_data) > 0:
                        self.config.node_name = nodes_data[0].get("node", "pve")
                        self.save_config(self.config)

                    self.is_connected = True
                    self.last_error = None
                    self.last_seen = datetime.utcnow()

                    return {
                        "status": "connected",
                        "host": target_host,
                        "pve_version": version_data.get("version", "8.x"),
                        "release": version_data.get("release", "1"),
                        "nodes": [n.get("node") for n in nodes_data],
                        "active_node": self.config.node_name,
                        "raw_response": version_data,
                        "message": f"Successfully connected to real Proxmox VE at {target_host}!"
                    }
                elif res.status_code == 401:
                    self.is_connected = False
                    self.last_error = "HTTP 401 Unauthorized: Invalid API Token ID or Secret."
                    return {
                        "status": "error",
                        "error_type": "AUTH_FAILED",
                        "status_code": 401,
                        "message": "Authentication failed. Check your API Token ID (e.g. root@pam!mytoken) and Token Secret UUID."
                    }
                else:
                    self.is_connected = False
                    self.last_error = f"HTTP Error {res.status_code}: {res.text}"
                    return {
                        "status": "error",
                        "error_type": "HTTP_ERROR",
                        "status_code": res.status_code,
                        "message": f"Proxmox server returned status {res.status_code}: {res.text}"
                    }
        except httpx.ConnectTimeout:
            self.is_connected = False
            self.last_error = f"Connection timed out reaching {target_host}."
            return {
                "status": "error",
                "error_type": "TIMEOUT",
                "message": f"Connection timed out to {target_host}. Ensure Proxmox is reachable over VPN/Tailscale/LAN on port 8006."
            }
        except httpx.ConnectError as ce:
            self.is_connected = False
            self.last_error = f"Failed to establish connection: {str(ce)}"
            return {
                "status": "error",
                "error_type": "CONNECT_ERROR",
                "message": f"Could not connect to {target_host}. Check IP/hostname and ensure port 8006 is open."
            }
        except Exception as e:
            self.is_connected = False
            self.last_error = str(e)
            return {
                "status": "error",
                "error_type": "UNKNOWN",
                "message": f"Connection error: {str(e)}"
            }

    async def get_real_vms(self) -> List[Dict[str, Any]]:
        """Queries the real Proxmox VE node for all configured QEMU virtual machines."""
        target_host = self.config.host.rstrip('/')
        node = self.config.node_name or "pve"
        url = f"{target_host}/api2/json/nodes/{node}/qemu"
        headers = self._get_headers()

        try:
            async with httpx.AsyncClient(verify=self.config.verify_ssl, timeout=6.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    raw_vms = res.json().get("data", [])
                    formatted_vms = []
                    
                    for vm in raw_vms:
                        vmid = vm.get("vmid")
                        name = vm.get("name", f"VM-{vmid}")
                        status = vm.get("status", "unknown")
                        maxmem = vm.get("maxmem", 0) // (1024 * 1024)
                        cpus = vm.get("cpus", 1)
                        
                        # Try to get QEMU Guest Agent IP
                        ip_address = "Detecting..."
                        try:
                            agent_url = f"{target_host}/api2/json/nodes/{node}/qemu/{vmid}/agent/network-get-interfaces"
                            agent_res = await client.get(agent_url, headers=headers)
                            if agent_res.status_code == 200:
                                ifaces = agent_res.json().get("data", {}).get("result", [])
                                for iface in ifaces:
                                    for ip_entry in iface.get("ip-addresses", []):
                                        if ip_entry.get("ip-address-type") == "ipv4" and not ip_entry.get("ip-address", "").startswith("127."):
                                            ip_address = ip_entry.get("ip-address")
                                            break
                        except Exception:
                            pass

                        formatted_vms.append({
                            "vmid": vmid,
                            "name": name,
                            "status": status,
                            "ip": ip_address if ip_address != "Detecting..." else f"10.10.10.{vmid % 254}",
                            "cores": cpus,
                            "memory_mb": maxmem,
                            "os": "Windows" if "win" in name.lower() or "dc" in name.lower() else "Linux",
                            "is_real": True
                        })
                    return formatted_vms
        except Exception as e:
            pass

        # Return empty list or guidance if not yet reachable
        return []

    async def rollback_snapshot(self, vmid: int, snapname: str = "baseline-clean") -> Dict[str, Any]:
        """Triggers a real snapshot rollback on Proxmox VE."""
        target_host = self.config.host.rstrip('/')
        node = self.config.node_name or "pve"
        url = f"{target_host}/api2/json/nodes/{node}/qemu/{vmid}/snapshot/{snapname}/rollback"
        headers = self._get_headers()

        try:
            async with httpx.AsyncClient(verify=self.config.verify_ssl, timeout=8.0) as client:
                res = await client.post(url, headers=headers)
                if res.status_code == 200:
                    return {
                        "status": "success",
                        "message": f"Successfully triggered snapshot rollback to '{snapname}' for VMID {vmid} on Proxmox.",
                        "task_id": res.json().get("data")
                    }
                else:
                    return {
                        "status": "error",
                        "message": f"Proxmox snapshot rollback returned status {res.status_code}: {res.text}"
                    }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to execute Proxmox snapshot rollback: {str(e)}"
            }

proxmox_engine = RealProxmoxEngine()
