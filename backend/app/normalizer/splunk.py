from datetime import datetime
from typing import Dict, Any
from app.normalizer.schema import ShadowEvent

def parse_splunk_result(raw: Dict[str, Any], collector: str = "splunk_search") -> ShadowEvent:
    """Normalize Splunk Search API result or Notable Event into 29-field ShadowEvent."""
    raw_time = raw.get("_time", raw.get("time"))
    try:
        ts = datetime.fromisoformat(raw_time.replace("Z", "+00:00")) if raw_time else datetime.utcnow()
    except Exception:
        ts = datetime.utcnow()

    hostname = raw.get("host", raw.get("dest", raw.get("Computer", "UNKNOWN-HOST")))
    src_ip = raw.get("src", raw.get("src_ip"))
    dst_ip = raw.get("dest", raw.get("dest_ip"))
    user = raw.get("user", raw.get("user_name", "SYSTEM"))
    process = raw.get("process_name", raw.get("process", raw.get("Image")))
    cmdline = raw.get("cmdline", raw.get("CommandLine", ""))
    
    mitre_tactic = raw.get("mitre_tactic", raw.get("tactic"))
    mitre_technique = raw.get("mitre_technique", raw.get("technique"))
    severity = raw.get("urgency", raw.get("severity", "medium")).lower()
    
    # Calculate risk score
    risk = 20
    if severity == "critical":
        risk = 80
    elif severity == "high":
        risk = 60
    elif severity == "medium":
        risk = 35

    return ShadowEvent(
        timestamp=ts,
        source="splunk",
        collector=collector,
        hostname=hostname,
        ip=dst_ip or src_ip,
        user=user,
        process=process,
        command_line=cmdline or None,
        src_ip=src_ip,
        dst_ip=dst_ip,
        event_type="splunk_notable" if "notable" in raw.get("source", "") else "splunk_event",
        severity=severity if severity in ["info", "low", "medium", "high", "critical"] else "medium",
        confidence=1.0,
        risk_score=risk,
        mitre_tactic=mitre_tactic,
        mitre_technique=mitre_technique,
        exercise_id=raw.get("exercise_id"),
        action_id=raw.get("action_id"),
        raw_event=raw,
        correlation_id=raw.get("correlation_id")
    )
