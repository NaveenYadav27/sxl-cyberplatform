import asyncio
import uuid
import logging
from datetime import datetime
from typing import Callable

logger = logging.getLogger("EdgeSyslogCollector")

class SyslogProtocol(asyncio.DatagramProtocol):
    def __init__(self, enqueue_callback: Callable):
        self.enqueue_callback = enqueue_callback

    def datagram_received(self, data: bytes, addr):
        try:
            message = data.decode("utf-8", errors="ignore").strip()
            envelope = {
                "event_id": f"evt-{uuid.uuid4().hex[:12]}",
                "source": "syslog",
                "collector_id": f"edge-syslog:514",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "src_ip": addr[0],
                "raw_event": {"message": message, "sender_ip": addr[0]}
            }
            self.enqueue_callback(envelope)
        except Exception as e:
            logger.debug(f"Syslog parse error: {e}")

class EdgeSyslogCollector:
    """UDP Syslog listener on port 514 for Auditd and Zeek stream ingestion."""
    def __init__(self, enqueue_callback: Callable, port: int = 514):
        self.enqueue_callback = enqueue_callback
        self.port = port
        self.transport = None

    async def start(self):
        loop = asyncio.get_running_loop()
        try:
            self.transport, _ = await loop.create_datagram_endpoint(
                lambda: SyslogProtocol(self.enqueue_callback),
                local_addr=("0.0.0.0", self.port)
            )
            logger.info(f"[+] Edge Syslog Collector listening on 0.0.0.0:{self.port} (UDP)")
        except Exception as e:
            logger.warning(f"[-] Could not bind Syslog port {self.port}: {e}")
