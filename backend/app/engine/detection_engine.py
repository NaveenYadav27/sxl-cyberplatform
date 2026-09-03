import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from app.normalizer.schema import ShadowEvent
from app.database import async_session_maker, DetectionModel, IncidentCaseModel, AssetModel
from app.websocket.event_bus import event_bus
from sqlalchemy import select

class DetectionEngine:
    def __init__(self):
        # Sigma / Behavioral Detection Rules
        self.rules = [
            {
                "rule_name": "Suspicious_PowerShell_Execution",
                "title": "Suspicious Encoded PowerShell Execution",
                "tactic": "execution",
                "technique": "T1059.001",
                "severity": "high",
                "risk_delta": 45,
                "matcher": lambda e: (
                    e.process and "powershell" in e.process.lower() and
                    e.command_line and any(x in e.command_line.lower() for x in ["-enc", "encodedcommand", "downloadstring", "iex"])
                )
            },
            {
                "rule_name": "LSASS_Memory_Access",
                "title": "Potential Credential Dumping via LSASS Access",
                "tactic": "credential-access",
                "technique": "T1003.001",
                "severity": "critical",
                "risk_delta": 85,
                "matcher": lambda e: (
                    (e.command_line and any(x in e.command_line.lower() for x in ["mimikatz", "sekurlsa", "procdump"])) or
                    (e.file_path and "lsass.dmp" in e.file_path.lower())
                )
            },
            {
                "rule_name": "Linux_Privileged_Shadow_Access",
                "title": "Direct Read of /etc/shadow",
                "tactic": "credential-access",
                "technique": "T1003.008",
                "severity": "high",
                "risk_delta": 60,
                "matcher": lambda e: (
                    e.source in ["auditd", "syslog"] and
                    e.command_line and "/etc/shadow" in e.command_line
                )
            },
            {
                "rule_name": "C2_Suspicious_Outbound_Port",
                "title": "Network Connection to Common Reverse Shell Port",
                "tactic": "command-and-control",
                "technique": "T1071",
                "severity": "high",
                "risk_delta": 40,
                "matcher": lambda e: (
                    e.dst_port in [4444, 1337, 8888, 31337]
                )
            }
        ]

    async def evaluate(self, event: ShadowEvent) -> List[Dict[str, Any]]:
        """Evaluate event against detection rules, insert detections & update cases."""
        matched_detections = []
        
        for rule in self.rules:
            try:
                if rule["matcher"](event):
                    detection_id = f"det-{uuid.uuid4().hex[:12]}"
                    det_data = {
                        "detection_id": detection_id,
                        "title": rule["title"],
                        "rule_name": rule["rule_name"],
                        "severity": rule["severity"],
                        "mitre_tactic": rule["tactic"],
                        "mitre_technique": rule["technique"],
                        "triggered_at": datetime.utcnow().isoformat() + "Z",
                        "event_id": event.event_id,
                        "hostname": event.hostname,
                        "ip": event.ip,
                        "risk_score_delta": rule["risk_delta"],
                        "details": {
                            "process": event.process,
                            "command_line": event.command_line,
                            "user": event.user,
                            "source": event.source
                        }
                    }
                    
                    # Persist detection to database
                    async with async_session_maker() as session:
                        db_det = DetectionModel(
                            detection_id=detection_id,
                            title=rule["title"],
                            rule_name=rule["rule_name"],
                            severity=rule["severity"],
                            mitre_tactic=rule["tactic"],
                            mitre_technique=rule["technique"],
                            event_id=event.event_id,
                            hostname=event.hostname,
                            risk_score_delta=rule["risk_delta"],
                            details=det_data["details"]
                        )
                        session.add(db_det)
                        
                        # Automatically link or spawn an Incident Case if severity >= high
                        if rule["severity"] in ["high", "critical"]:
                            case_id = f"CASE-PX-{uuid.uuid4().hex[:6].upper()}"
                            db_case = IncidentCaseModel(
                                case_id=case_id,
                                title=f"Incident: {rule['title']} on {event.hostname or 'Target'}",
                                severity=rule["severity"],
                                status="open",
                                target_hostname=event.hostname,
                                exercise_id=event.exercise_id,
                                timeline_events=[{
                                    "timestamp": datetime.utcnow().isoformat() + "Z",
                                    "stage": "DETECTION_FIRED",
                                    "delta_s": 0.0,
                                    "desc": f"Rule {rule['rule_name']} triggered for event {event.event_id}"
                                }],
                                evidence_ids={
                                    "event_ids": [event.event_id],
                                    "detection_ids": [detection_id],
                                    "action_ids": [event.action_id] if event.action_id else []
                                }
                            )
                            session.add(db_case)
                            det_data["case_id"] = case_id
                            
                        await session.commit()
                        
                    # Broadcast alert live to connected frontend consoles
                    await event_bus.publish_detection(det_data)
                    matched_detections.append(det_data)
            except Exception:
                continue
                
        return matched_detections

detection_engine = DetectionEngine()
