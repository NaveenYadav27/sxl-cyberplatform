import json
from datetime import datetime
from typing import Dict, Any, List
from app.collectors.agent_ingest import agent_ingest

class SplunkHECReceiver:
    """Handles standard HTTP Event Collector (HEC) JSON payloads on port 8088."""
    
    async def handle_hec_payload(self, raw_body: str) -> Dict[str, Any]:
        """Parse raw lines or batch JSON from Splunk Universal Forwarder / HEC client."""
        results = []
        for line in raw_body.strip().split("\n"):
            if not line.strip():
                continue
            try:
                payload = json.loads(line)
                event_data = payload.get("event", payload)
                res = await agent_ingest.process_raw_telemetry(event_data, source_hint="splunk_hec")
                results.append(res)
            except Exception:
                continue
        return {
            "text": "Success",
            "code": 0,
            "processed_count": len(results)
        }

hec_receiver = SplunkHECReceiver()
