import uuid
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from sqlalchemy import select
from app.database import async_session_maker, ShadowEventModel, AssetModel
from app.websocket.event_bus import event_bus

class CanonicalNormalizer:
    """
    Control Plane Canonical 29-Field ShadowEvent Normalizer.
    Enforces canonical schema validation, event deduplication, and issues Server ACKs.
    """

    def __init__(self):
        self.seen_event_ids = set()

    async def normalize_and_store(self, envelope: Dict[str, Any], agent_id: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Receives a RawEventEnvelope from an authenticated Edge Agent,
        normalizes into ShadowEvent v1.0, stores persistently, and produces Server ACK.
        """
        raw_event = envelope.get("raw_event", {})
        source_type = envelope.get("source", "unknown").lower()
        collector_id = envelope.get("collector_id", "edge-forwarder")
        client_event_id = envelope.get("event_id") or f"evt-{uuid.uuid4().hex[:12]}"
        seq_num = envelope.get("sequence_number", 0)

        # Idempotent Deduplication
        if client_event_id in self.seen_event_ids:
            return True, {
                "status": "ACK",
                "event_id": client_event_id,
                "sequence_number": seq_num,
                "server_time": datetime.utcnow().isoformat() + "Z",
                "deduplicated": True
            }

        # Canonical 29-Field Mapping
        timestamp_str = envelope.get("timestamp") or datetime.utcnow().isoformat()
        try:
            event_dt = datetime.fromisoformat(timestamp_str.replace("Z", ""))
        except Exception:
            event_dt = datetime.utcnow()

        hostname = envelope.get("hostname") or raw_event.get("Computer") or raw_event.get("host") or "Unknown-Host"
        ip_addr = envelope.get("ip") or raw_event.get("IpAddress") or raw_event.get("src_ip") or None
        user_name = envelope.get("user") or raw_event.get("User") or raw_event.get("account") or None
        process_name = envelope.get("process") or raw_event.get("Image") or raw_event.get("process_name") or None
        parent_proc = envelope.get("parent_process") or raw_event.get("ParentImage") or None
        cmdline = envelope.get("command_line") or raw_event.get("CommandLine") or None
        f_hash = envelope.get("file_hash") or raw_event.get("Hashes") or raw_event.get("sha256") or None
        src_ip = envelope.get("src_ip") or raw_event.get("SourceIp") or None
        src_port = envelope.get("src_port") or raw_event.get("SourcePort") or None
        dst_ip = envelope.get("dst_ip") or raw_event.get("DestinationIp") or None
        dst_port = envelope.get("dst_port") or raw_event.get("DestinationPort") or None
        proto = envelope.get("protocol") or raw_event.get("Protocol") or None
        event_type = envelope.get("event_type") or raw_event.get("EventName") or "telemetry_event"
        severity = envelope.get("severity") or "info"
        risk_score = int(envelope.get("risk_score") or 0)
        mitre_tactic = envelope.get("mitre_tactic")
        mitre_technique = envelope.get("mitre_technique")
        exercise_id = envelope.get("exercise_id")
        action_id = envelope.get("action_id")
        correlation_id = envelope.get("correlation_id") or f"corr-{uuid.uuid4().hex[:8]}"

        async with async_session_maker() as session:
            # Check DB deduplication
            existing = await session.execute(
                select(ShadowEventModel).where(ShadowEventModel.event_id == client_event_id)
            )
            if existing.scalars().first():
                self.seen_event_ids.add(client_event_id)
                return True, {
                    "status": "ACK",
                    "event_id": client_event_id,
                    "sequence_number": seq_num,
                    "server_time": datetime.utcnow().isoformat() + "Z",
                    "deduplicated": True
                }

            # Find matching asset
            asset_id = None
            if hostname or ip_addr:
                asset_res = await session.execute(
                    select(AssetModel).where(
                        (AssetModel.hostname == hostname) | (AssetModel.ip_address == ip_addr)
                    )
                )
                asset_obj = asset_res.scalars().first()
                if asset_obj:
                    asset_id = asset_obj.asset_id
                    asset_obj.last_seen = datetime.utcnow()
                    if asset_obj.status == "DISCOVERED":
                        asset_obj.status = "ACTIVE"

            # Create Canonical ShadowEventModel
            event_obj = ShadowEventModel(
                event_id=client_event_id,
                schema_version="1.0",
                timestamp=event_dt,
                source=source_type,
                collector=collector_id,
                asset_id=asset_id,
                hostname=hostname,
                ip=ip_addr,
                user=user_name,
                process=process_name,
                parent_process=parent_proc,
                command_line=cmdline,
                file_hash=f_hash,
                src_ip=src_ip,
                src_port=src_port,
                dst_ip=dst_ip,
                dst_port=dst_port,
                protocol=proto,
                event_type=event_type,
                severity=severity,
                confidence=1.0,
                risk_score=risk_score,
                mitre_tactic=mitre_tactic,
                mitre_technique=mitre_technique,
                exercise_id=exercise_id,
                action_id=action_id,
                raw_event=raw_event,
                correlation_id=correlation_id
            )
            session.add(event_obj)
            await session.commit()

        self.seen_event_ids.add(client_event_id)

        # Broadcast over WebSocket event bus to browser clients
        await event_bus.broadcast("SHADOW_EVENT_INGESTED", {
            "event_id": client_event_id,
            "timestamp": event_dt.isoformat() + "Z",
            "source": source_type,
            "hostname": hostname,
            "process": process_name,
            "command_line": cmdline,
            "severity": severity,
            "agent_id": agent_id
        })

        return True, {
            "status": "ACK",
            "event_id": client_event_id,
            "sequence_number": seq_num,
            "server_time": datetime.utcnow().isoformat() + "Z",
            "deduplicated": False
        }

canonical_normalizer = CanonicalNormalizer()
