from datetime import datetime
from typing import Dict, Any
from app.normalizer.schema import ShadowEvent

def parse_zeek_event(raw: Dict[str, Any], log_type: str = "conn", collector: str = "zeek_stream") -> ShadowEvent:
    """Normalize Zeek JSON (conn.log, dns.log, http.log) into 29-field ShadowEvent."""
    ts_val = raw.get("ts")
    try:
        ts = datetime.utcfromtimestamp(float(ts_val)) if ts_val else datetime.utcnow()
    except Exception:
        ts = datetime.utcnow()

    src_ip = raw.get("id.orig_h", raw.get("src_ip"))
    src_port = int(raw.get("id.orig_p", 0)) if raw.get("id.orig_p") else None
    dst_ip = raw.get("id.resp_h", raw.get("dst_ip"))
    dst_port = int(raw.get("id.resp_p", 0)) if raw.get("id.resp_p") else None
    proto = raw.get("proto", "tcp").lower()
    
    tactic, technique = None, None
    severity = "info"
    risk = 0
    event_type = f"zeek_{log_type}"

    if log_type == "dns":
        query = raw.get("query", "")
        if ".burpcollaborator." in query or ".oast." in query or len(query) > 50:
            tactic = "exfiltration"
            technique = "T1048.003"
            severity = "high"
            risk = 65
    elif log_type == "conn":
        if dst_port in [4444, 1337, 8888, 31337]:
            tactic = "command-and-control"
            technique = "T1071"
            severity = "high"
            risk = 70

    return ShadowEvent(
        timestamp=ts,
        source="zeek",
        collector=collector,
        src_ip=src_ip,
        src_port=src_port,
        dst_ip=dst_ip,
        dst_port=dst_port,
        protocol=proto,
        event_type=event_type,
        severity=severity,
        confidence=1.0,
        risk_score=risk,
        mitre_tactic=tactic,
        mitre_technique=technique,
        exercise_id=raw.get("exercise_id"),
        action_id=raw.get("action_id"),
        raw_event=raw
    )
