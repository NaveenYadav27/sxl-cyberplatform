import re
from datetime import datetime
from typing import Dict, Any, Optional
from app.normalizer.schema import ShadowEvent

def parse_sysmon_event(raw: Dict[str, Any], collector: str = "hec:8088") -> ShadowEvent:
    """Normalize Windows Sysmon (JSON/XML/WinEvent) into 29-field ShadowEvent."""
    data = raw.get("EventData", raw)
    system = raw.get("System", {})
    
    event_id_code = str(system.get("EventID", data.get("EventId", "1")))
    timestamp_str = system.get("TimeCreated", {}).get("@SystemTime", data.get("UtcTime"))
    
    try:
        ts = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00")) if timestamp_str else datetime.utcnow()
    except Exception:
        ts = datetime.utcnow()

    # Event ID 1: Process Creation
    if event_id_code in ["1", "4688"]:
        image = data.get("Image", data.get("NewProcessName", ""))
        process_name = image.split("\\")[-1] if "\\" in image else image
        parent_image = data.get("ParentImage", data.get("ParentProcessName", ""))
        parent_process = parent_image.split("\\")[-1] if "\\" in parent_image else parent_image
        command_line = data.get("CommandLine", "")
        user = data.get("User", data.get("SubjectUserName", "SYSTEM"))
        hashes = data.get("Hashes", "")
        sha256 = ""
        if "SHA256=" in hashes:
            match = re.search(r"SHA256=([A-Fa-f0-9]+)", hashes)
            if match:
                sha256 = match.group(1)

        # ATT&CK heuristic
        tactic, technique = None, None
        severity = "low"
        risk = 10
        
        cmd_lower = command_line.lower()
        if "powershell" in process_name.lower() or "pwsh" in process_name.lower():
            tactic = "execution"
            technique = "T1059.001"
            if any(x in cmd_lower for x in ["-enc", "encodedcommand", "downloadstring", "iex", "invoke-expression"]):
                severity = "high"
                risk = 45
        elif "cmd.exe" in process_name.lower() and any(x in cmd_lower for x in ["whoami", "net user", "vssadmin"]):
            tactic = "discovery"
            technique = "T1033"
            severity = "medium"
            risk = 30
        elif "mimikatz" in cmd_lower or "lsass" in cmd_lower:
            tactic = "credential-access"
            technique = "T1003.001"
            severity = "critical"
            risk = 85

        return ShadowEvent(
            timestamp=ts,
            source="sysmon",
            collector=collector,
            hostname=data.get("Computer", system.get("Computer", "WIN-ENDPOINT")),
            ip=data.get("HostIp", raw.get("ip")),
            user=user,
            process=process_name,
            parent_process=parent_process,
            command_line=command_line,
            file_path=image,
            file_hash=sha256 or None,
            event_type="process_creation",
            severity=severity,
            confidence=1.0,
            risk_score=risk,
            mitre_tactic=tactic,
            mitre_technique=technique,
            exercise_id=raw.get("exercise_id"),
            action_id=raw.get("action_id"),
            raw_event=raw,
            correlation_id=raw.get("correlation_id")
        )

    # Event ID 3: Network Connection
    elif event_id_code in ["3", "5156"]:
        image = data.get("Image", "")
        process_name = image.split("\\")[-1] if "\\" in image else image
        src_ip = data.get("SourceIp")
        src_port = int(data.get("SourcePort", 0)) if data.get("SourcePort") else None
        dst_ip = data.get("DestinationIp")
        dst_port = int(data.get("DestinationPort", 0)) if data.get("DestinationPort") else None
        protocol = data.get("Protocol", "tcp").lower()
        
        return ShadowEvent(
            timestamp=ts,
            source="sysmon",
            collector=collector,
            hostname=data.get("Computer", system.get("Computer", "WIN-ENDPOINT")),
            ip=src_ip,
            user=data.get("User", "SYSTEM"),
            process=process_name,
            src_ip=src_ip,
            src_port=src_port,
            dst_ip=dst_ip,
            dst_port=dst_port,
            protocol=protocol,
            event_type="net_conn",
            severity="medium" if dst_port in [4444, 1337, 8888] else "info",
            confidence=1.0,
            risk_score=35 if dst_port in [4444, 1337] else 5,
            mitre_tactic="command-and-control" if dst_port in [4444, 1337] else None,
            mitre_technique="T1071.001" if dst_port in [4444, 1337] else None,
            exercise_id=raw.get("exercise_id"),
            action_id=raw.get("action_id"),
            raw_event=raw
        )

    # Default fallback normalization
    return ShadowEvent(
        timestamp=ts,
        source="sysmon",
        collector=collector,
        hostname=data.get("Computer", "WIN-ENDPOINT"),
        event_type=f"sysmon_eid_{event_id_code}",
        severity="info",
        raw_event=raw
    )
