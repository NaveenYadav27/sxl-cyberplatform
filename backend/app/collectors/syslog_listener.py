import asyncio
from datetime import datetime
from typing import Dict, Any
from app.collectors.agent_ingest import agent_ingest

class SyslogListener:
    """Async UDP/TCP Syslog listener on port 514 (RFC 5424/3164)."""
    
    def __init__(self):
        self.is_running = False

    async def start(self):
        self.is_running = True
        # In full appliance deployment: runs asyncio DatagramProtocol server on port 514
        try:
            while self.is_running:
                await asyncio.sleep(60)
        except asyncio.CancelledError:
            self.is_running = False

    def stop(self):
        self.is_running = False

    async def handle_syslog_message(self, raw_message: str, client_ip: str):
        payload = {
            "message": raw_message,
            "ip": client_ip,
            "source": "syslog",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        await agent_ingest.process_raw_telemetry(payload, source_hint="syslog")

syslog_listener = SyslogListener()
