from datetime import datetime
from typing import Dict, Any
from app.normalizer.schema import ShadowEvent

def parse_linux_audit_event(raw: Dict[str, Any], collector: str = "syslog:514") -> ShadowEvent:
    """Normalize Linux Auditd / Journald log into 29-field ShadowEvent."""
    msg = raw.get("message", str(raw))
    hostname = raw.get("hostname", raw.get("host", "LINUX-SRV"))
    ts = datetime.utcnow()
    
    # Process execution SYSCALL/EXECVE
    exe = raw.get("exe", raw.get("comm", ""))
    process_name = exe.split("/")[-1] if "/" in exe else exe
    cmdline = raw.get("cmdline", raw.get("proctitle", exe))
    user = raw.get("user", raw.get("uid_name", "root"))
    
    tactic, technique = None, None
    severity = "info"
    risk = 5
    
    cmd_lower = str(cmdline).lower()
    if any(k in cmd_lower for k in ["/etc/shadow", "/etc/passwd", "useradd", "sudoers"]):
        tactic = "credential-access" if "shadow" in cmd_lower else "persistence"
        technique = "T1003.008" if "shadow" in cmd_lower else "T1078.003"
        severity = "high"
        risk = 60
    elif any(k in cmd_lower for k in ["nc -e", "bash -i", "/dev/tcp/"]):
        tactic = "execution"
        technique = "T1059.004"
        severity = "critical"
        risk = 85

    return ShadowEvent(
        timestamp=ts,
        source="auditd",
        collector=collector,
        hostname=hostname,
        ip=raw.get("ip"),
        user=user,
        process=process_name or "execve",
        command_line=str(cmdline),
        file_path=exe or None,
        event_type="process_creation" if exe else "linux_audit",
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
