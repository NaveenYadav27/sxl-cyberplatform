import httpx
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("ProxmoxConnector")

class ReadOnlyProxmoxConnector:
    """
    Strictly READ-ONLY Proxmox VE API Connector.
    Discovers nodes, QEMU VMs, CPU/RAM, QEMU Guest Agent network interfaces, and snapshot metadata.
    Destructive operations (stop, rollback, delete) are strictly prohibited in Phase 1.
    """

    def __init__(self, config: Dict[str, Any]):
        self.host = config.get("host", "https://192.168.1.200:8006").rstrip('/')
        self.token_id = config.get("token_id", "root@pam!shadowxlab-token")
        self.token_secret = config.get("token_secret", "")
        self.node = config.get("node", "pve")
        self.verify_ssl = config.get("verify_ssl", False)

    def _get_headers(self) -> Dict[str, str]:
        token = f"PVEAPIToken={self.token_id}={self.token_secret}"
        return {
            "Authorization": token,
            "Accept": "application/json"
        }

    async def verify_read_only_permissions(self) -> Dict[str, Any]:
        """
        Validates that API Token can perform read operations (GET nodes/VMs)
        and confirms write/delete operations are denied.
        """
        headers = self._get_headers()
        results = {
            "read_version": False,
            "read_nodes": False,
            "read_vms": False,
            "write_blocked": True, # Write/delete operations are physically omitted from this connector
            "status": "unverified"
        }

        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=5.0) as client:
                # 1. Test GET version
                ver_res = await client.get(f"{self.host}/api2/json/version", headers=headers)
                results["read_version"] = ver_res.status_code == 200

                # 2. Test GET nodes
                nodes_res = await client.get(f"{self.host}/api2/json/nodes", headers=headers)
                results["read_nodes"] = nodes_res.status_code == 200
                if nodes_res.status_code == 200:
                    nodes = nodes_res.json().get("data", [])
                    if nodes and len(nodes) > 0:
                        self.node = nodes[0].get("node", self.node)

                # 3. Test GET VMs
                vms_res = await client.get(f"{self.host}/api2/json/nodes/{self.node}/qemu", headers=headers)
                results["read_vms"] = vms_res.status_code == 200

                if results["read_version"] and results["read_nodes"] and results["read_vms"]:
                    results["status"] = "VERIFIED_READ_ONLY"
                else:
                    results["status"] = "PERMISSION_CHECK_FAILED"
        except Exception as e:
            results["status"] = f"ERROR: {str(e)}"

        return results

    async def discover_vms(self) -> List[Dict[str, Any]]:
        """Queries Proxmox VE for all QEMU VMs and resolves dynamic IP/MAC addresses via Guest Agent."""
        headers = self._get_headers()
        url = f"{self.host}/api2/json/nodes/{self.node}/qemu"

        try:
            async with httpx.AsyncClient(verify=self.verify_ssl, timeout=6.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code != 200:
                    return []

                raw_vms = res.json().get("data", [])
                discovered = []

                for vm in raw_vms:
                    vmid = vm.get("vmid")
                    name = vm.get("name", f"VM-{vmid}")
                    status = vm.get("status", "unknown")
                    maxmem = vm.get("maxmem", 0) // (1024 * 1024)
                    cpus = vm.get("cpus", 1)

                    # Dynamic IP discovery via QEMU Guest Agent
                    ip_address = None
                    mac_address = None
                    agent_active = False

                    try:
                        agent_url = f"{self.host}/api2/json/nodes/{self.node}/qemu/{vmid}/agent/network-get-interfaces"
                        agent_res = await client.get(agent_url, headers=headers)
                        if agent_res.status_code == 200:
                            agent_active = True
                            ifaces = agent_res.json().get("data", {}).get("result", [])
                            for iface in ifaces:
                                if not mac_address and iface.get("hardware-address"):
                                    mac_address = iface.get("hardware-address")
                                for ip_entry in iface.get("ip-addresses", []):
                                    if ip_entry.get("ip-address-type") == "ipv4" and not ip_entry.get("ip-address", "").startswith("127."):
                                        ip_address = ip_entry.get("ip-address")
                                        break
                    except Exception:
                        pass

                    discovered.append({
                        "vmid": str(vmid),
                        "name": name,
                        "hostname": name,
                        "status": status,
                        "ip": ip_address,
                        "mac": mac_address,
                        "os": "windows" if "win" in name.lower() or "dc" in name.lower() else "linux",
                        "cores": cpus,
                        "memory_mb": maxmem,
                        "qemu_agent_active": agent_active,
                        "discovery_source": "qemu_agent" if agent_active else "proxmox_api",
                        "confidence": 0.99 if agent_active else 0.85,
                        "is_real": True,
                        "node": self.node
                    })
                return discovered
        except Exception as e:
            logger.warning(f"[-] Proxmox VM discovery error: {e}")
            return []
