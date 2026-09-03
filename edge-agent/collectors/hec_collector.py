import json
import uuid
import logging
from datetime import datetime
from aiohttp import web
from typing import Callable

logger = logging.getLogger("EdgeHECCollector")

class EdgeHECCollector:
    """
    Local Splunk HTTP Event Collector (HEC) receiver running on Edge Agent (port 8088).
    Accepts raw Sysmon and application events from lab endpoints, packages into RawEventEnvelope,
    and enqueues into local durable spool.
    """

    def __init__(self, enqueue_callback: Callable, port: int = 8088):
        self.enqueue_callback = enqueue_callback
        self.port = port
        self.app = web.Application()
        self.app.router.add_post("/services/collector/event", self.handle_hec)
        self.app.router.add_post("/services/collector", self.handle_hec)
        self.runner = None

    async def handle_hec(self, request: web.Request) -> web.Response:
        try:
            body = await request.text()
            # Handle multiple concatenated JSON objects
            for line in body.strip().split("\n"):
                if not line.strip():
                    continue
                try:
                    payload = json.loads(line)
                    raw_event = payload.get("event", payload)
                    envelope = {
                        "event_id": f"evt-{uuid.uuid4().hex[:12]}",
                        "source": payload.get("sourcetype") or "sysmon",
                        "collector_id": f"edge-hec:{self.port}",
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "hostname": payload.get("host") or (raw_event.get("Computer") if isinstance(raw_event, dict) else None),
                        "raw_event": raw_event
                    }
                    self.enqueue_callback(envelope)
                except Exception as ex:
                    logger.debug(f"HEC line parse error: {ex}")

            return web.json_response({"text": "Success", "code": 0})
        except Exception as e:
            return web.json_response({"text": f"Error: {e}", "code": 1}, status=400)

    async def start(self):
        self.runner = web.AppRunner(self.app)
        await self.runner.setup()
        site = web.TCPSite(self.runner, "0.0.0.0", self.port)
        await site.start()
        logger.info(f"[+] Edge HEC Collector listening on 0.0.0.0:{self.port}")
