from datetime import datetime
from typing import Dict, Any, List
from app.normalizer.schema import ShadowEvent
from app.normalizer.sysmon import parse_sysmon_event
from app.normalizer.linux_audit import parse_linux_audit_event
from app.normalizer.zeek import parse_zeek_event
from app.engine.detection_engine import detection_engine
from app.websocket.event_bus import event_bus
from app.database import async_session_maker, ShadowEventModel

class AgentIngestService:
    """Processes incoming telemetry events from agents, normalizes, persists, and triggers detection."""
    
    async def process_raw_telemetry(self, raw_payload: Dict[str, Any], source_hint: str = "sysmon") -> Dict[str, Any]:
        source = raw_payload.get("source", source_hint).lower()
        
        # Route to appropriate normalizer
        if "sysmon" in source or "winevent" in source or "windows" in source:
            event = parse_sysmon_event(raw_payload, collector="rest:8000")
        elif "audit" in source or "journal" in source or "linux" in source:
            event = parse_linux_audit_event(raw_payload, collector="rest:8000")
        elif "zeek" in source or "conn" in source:
            event = parse_zeek_event(raw_payload, collector="rest:8000")
        else:
            event = ShadowEvent(
                timestamp=datetime.utcnow(),
                source=source,
                collector="rest:8000",
                hostname=raw_payload.get("hostname", "UNKNOWN-HOST"),
                event_type="generic_telemetry",
                raw_event=raw_payload
            )

        # 1. Persist to Database (Write Only via Collector Pipeline)
        async with async_session_maker() as session:
            db_event = ShadowEventModel(
                event_id=event.event_id,
                schema_version=event.schema_version,
                timestamp=event.timestamp,
                source=event.source,
                collector=event.collector,
                asset_id=event.asset_id,
                hostname=event.hostname,
                ip=event.ip,
                mac=event.mac,
                user=event.user,
                process=event.process,
                parent_process=event.parent_process,
                command_line=event.command_line,
                file_path=event.file_path,
                file_hash=event.file_hash,
                src_ip=event.src_ip,
                src_port=event.src_port,
                dst_ip=event.dst_ip,
                dst_port=event.dst_port,
                protocol=event.protocol,
                event_type=event.event_type,
                severity=event.severity,
                confidence=event.confidence,
                risk_score=event.risk_score,
                mitre_tactic=event.mitre_tactic,
                mitre_technique=event.mitre_technique,
                exercise_id=event.exercise_id,
                action_id=event.action_id,
                raw_event=event.raw_event,
                correlation_id=event.correlation_id
            )
            session.add(db_event)
            await session.commit()

        # 2. Push to WebSocket live event bus
        await event_bus.publish_event(event)

        # 3. Evaluate detection rules
        detections = await detection_engine.evaluate(event)

        return {
            "status": "ingested",
            "event_id": event.event_id,
            "normalized_event": event.model_dump(),
            "detections_triggered": len(detections)
        }

agent_ingest = AgentIngestService()
