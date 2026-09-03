import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.api.assets import process_discovered_assets

class VirtualBoxHostAdapter:
    """Manages communication with the out-of-band VirtualBox Host Agent."""
    
    def __init__(self):
        self.connected_agents: Dict[str, Dict[str, Any]] = {}

    def register_agent(self, agent_id: str, host_os: str, version: str, vm_count: int) -> Dict[str, Any]:
        """Register or update heartbeat from host-side VBox agent."""
        now = datetime.utcnow()
        self.connected_agents[agent_id] = {
            "agent_id": agent_id,
            "host_os": host_os,
            "version": version,
            "vm_count": vm_count,
            "last_seen": now,
            "status": "connected"
        }
        return {
            "status": "enrolled",
            "agent_id": agent_id,
            "registered_at": now.isoformat() + "Z"
        }

    async def ingest_vbox_vms(self, agent_id: str, vms: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Ingest long format VBoxManage VM state list sent by host agent."""
        if agent_id in self.connected_agents:
            self.connected_agents[agent_id]["last_seen"] = datetime.utcnow()

        await process_discovered_assets(vms, agent_id)
        return vms

vbox_adapter = VirtualBoxHostAdapter()
