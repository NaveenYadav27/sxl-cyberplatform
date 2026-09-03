import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, IPvAnyAddress

class ShadowEvent(BaseModel):
    """
    Standardized 29-Field ShadowEvent Schema v1.0
    OCSF / ECS Aligned Cyber-Range Event Model
    """
    schema_version: str = Field(default="1.0", description="1. Schema version")
    event_id: str = Field(default_factory=lambda: f"evt-{uuid.uuid4().hex[:12]}", description="2. Unique Event UUID")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="3. UTC ISO Event Timestamp")
    source: str = Field(..., description="4. Origin telemetry source (sysmon, auditd, zeek, splunk, suricata, pve, winrm)")
    collector: str = Field(..., description="5. Ingestion collector channel (hec:8088, syslog:514, rest:8000, passive_sniff)")
    asset_id: Optional[str] = Field(default=None, description="6. Linked Asset Registry UUID")
    hostname: Optional[str] = Field(default=None, description="7. Hostname (e.g. WIN11-01, DC01)")
    ip: Optional[str] = Field(default=None, description="8. Primary IP address")
    mac: Optional[str] = Field(default=None, description="9. Primary MAC address")
    user: Optional[str] = Field(default=None, description="10. User / Domain Account")
    process: Optional[str] = Field(default=None, description="11. Process executable name (e.g. powershell.exe)")
    parent_process: Optional[str] = Field(default=None, description="12. Parent process name (e.g. explorer.exe)")
    command_line: Optional[str] = Field(default=None, description="13. Full process command line with arguments")
    file_path: Optional[str] = Field(default=None, description="14. File system path accessed/created")
    file_hash: Optional[str] = Field(default=None, description="15. SHA256 / MD5 file hash")
    src_ip: Optional[str] = Field(default=None, description="16. Network source IP")
    src_port: Optional[int] = Field(default=None, description="17. Network source port")
    dst_ip: Optional[str] = Field(default=None, description="18. Network destination IP")
    dst_port: Optional[int] = Field(default=None, description="19. Network destination port")
    protocol: Optional[str] = Field(default=None, description="20. Network protocol (tcp, udp, icmp, dns, http)")
    event_type: str = Field(..., description="21. Event category (process_creation, net_conn, auth_success, priv_esc)")
    severity: str = Field(default="info", description="22. Severity level (info, low, medium, high, critical)")
    confidence: float = Field(default=1.0, description="23. Event confidence score (0.0 to 1.0)")
    risk_score: int = Field(default=0, description="24. Computed risk delta (0 to 100)")
    mitre_tactic: Optional[str] = Field(default=None, description="25. MITRE ATT&CK Tactic (e.g. execution, persistence)")
    mitre_technique: Optional[str] = Field(default=None, description="26. MITRE ATT&CK Technique ID (e.g. T1059.001)")
    exercise_id: Optional[str] = Field(default=None, description="27. Active Purple Exercise UUID")
    action_id: Optional[str] = Field(default=None, description="28. Red Team Action UUID")
    raw_event: Dict[str, Any] = Field(default_factory=dict, description="29. Original unparsed raw event payload")
    correlation_id: Optional[str] = Field(default=None, description="Group correlation ID for multi-stage attacks")

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat() + "Z"
        }
