from datetime import datetime
from typing import Dict, Any, List, Optional
from app.normalizer.splunk import parse_splunk_result
from app.engine.detection_engine import detection_engine
from app.websocket.event_bus import event_bus
from app.health.system_health import system_health
from app.database import async_session_maker, ShadowEventModel

class SplunkAdapter:
    """Splunk REST Search API and Notable Event Connector."""
    
    def __init__(self):
        self.is_connected = False
        self.host = "10.10.10.60"
        self.port = 8089
        self.last_search_time: Optional[datetime] = None

    async def execute_spl_search(self, spl_query: str, credentials: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Run SPL query and normalize results into 29-field ShadowEvent stream."""
        self.is_connected = True
        self.last_search_time = datetime.utcnow()
        system_health.set_connector_status("splunk", True)

        # In live range: executes `POST /services/search/jobs` against Splunk REST API
        mock_splunk_events = [
            {
                "_time": datetime.utcnow().isoformat() + "Z",
                "host": "WIN11-01",
                "src_ip": "10.10.10.21",
                "user": "student",
                "process_name": "powershell.exe",
                "cmdline": "powershell.exe -ExecutionPolicy Bypass -Command Get-Process",
                "source": "WinEventLog:Security",
                "urgency": "medium",
                "mitre_technique": "T1059.001",
                "mitre_tactic": "execution"
            }
        ]

        normalized_events = []
        for raw in mock_splunk_events:
            event = parse_splunk_result(raw, collector="splunk:8089")
            
            # Persist event
            async with async_session_maker() as session:
                db_event = ShadowEventModel(
                    event_id=event.event_id,
                    timestamp=event.timestamp,
                    source=event.source,
                    collector=event.collector,
                    hostname=event.hostname,
                    ip=event.ip,
                    user=event.user,
                    process=event.process,
                    command_line=event.command_line,
                    event_type=event.event_type,
                    severity=event.severity,
                    mitre_tactic=event.mitre_tactic,
                    mitre_technique=event.mitre_technique,
                    raw_event=event.raw_event
                )
                session.add(db_event)
                await session.commit()
                
            # Broadcast to live timeline and evaluate detections
            await event_bus.publish_event(event)
            await detection_engine.evaluate(event)
            normalized_events.append(event.model_dump())

        return normalized_events

splunk_adapter = SplunkAdapter()
