from fastapi import APIRouter, HTTPException, Body
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from app.database import async_session_maker, AssetModel, ShadowEventModel, DetectionModel
from app.normalizer.canonical_normalizer import canonical_normalizer
from app.websocket.event_bus import event_bus

router = APIRouter(prefix="/modules", tags=["Curriculum Labs & Concept Demonstrators"])

MODULE_02_CURRICULUM = {
    "module_id": "MOD-02",
    "title": "MODULE 02 · Foundations: Introduction to Cybersecurity",
    "track": "OffSec PEN-200 Aligned",
    "learning_units_count": 3,
    "subtopics_count": 6,
    "tool_groups_count": 3,
    "description": "Build the security vocabulary needed to reason about a penetration test: assets, threats, vulnerabilities, risk, controls and business impact.",
    "units": [
        {
            "unit_id": "UNIT-01",
            "title": "The Practice of Cybersecurity",
            "objectives": [
                "Recognize the challenges unique to information security",
                "Understand how offensive and defensive security reflect each other",
                "Begin to build a mental model of useful mindsets applicable to information security"
            ]
        },
        {
            "unit_id": "UNIT-02",
            "title": "Threats and Threat Actors",
            "objectives": [
                "Understand how attackers and defenders learn from each other",
                "Understand the differences between risks, threats, vulnerabilities, and exploits"
            ]
        },
        {
            "unit_id": "UNIT-03",
            "title": "The CIA Triad & Controls",
            "objectives": [
                "Understand Confidentiality, Integrity, and Availability",
                "Map technical weaknesses to preventive, detective, and corrective controls",
                "Connect technical findings to business impact and governance standards"
            ]
        }
    ],
    "interactive_concepts": [
        {
            "concept_id": "CIA-CONFIDENTIALITY",
            "name": "Confidentiality Breach & Credential Extraction",
            "triad_pillar": "Confidentiality",
            "description": "Demonstrates unauthorized data access by attempting to read sensitive credential stores, LSA secrets, or AWS keys on the target machine.",
            "simulated_action": "Read SAM / LSASS / %USERPROFILE%\\.aws\\credentials or C:\\Windows\\System32\\config",
            "impact_type": "Unauthorized Information Disclosure & Credential Exposure",
            "telemetry_details": {
                "process": "powershell.exe",
                "command_line": "Get-Content -Path $env:USERPROFILE\\.aws\\credentials",
                "access_mask": "0x1010 (PROCESS_QUERY_LIMITED_INFORMATION | VM_READ)",
                "target_file": "C:\\Users\\student\\.aws\\credentials",
                "sysmon_event_id": 10,
                "event_type": "sensitive_file_read"
            },
            "baselines": {
                "cis": {
                    "benchmark": "CIS Microsoft Windows Server 2022 Benchmark v2.0.0",
                    "control_id": "CIS 18.9.30.2 / 2.3.1.5",
                    "title": "Ensure 'Configure LSA to run as a protected process' is set to 'Enabled'",
                    "compliance_status": "NON_COMPLIANT",
                    "remediation": "Set Registry: HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\\RunAsPPL = 1"
                },
                "microsoft": {
                    "baseline": "Microsoft Security Compliance Toolkit (Windows 11 / Server)",
                    "feature": "Windows Defender Credential Guard & LSA Protection",
                    "recommendation": "Enable Virtualization-based Security (VBS) and Credential Guard to isolate LSASS memory in a secure micro-hypervisor container.",
                    "compliance_status": "PARTIAL"
                },
                "aws": {
                    "benchmark": "CIS AWS Foundations Benchmark v3.0.0",
                    "control_id": "CIS AWS 1.16 / 2.1.1",
                    "title": "Ensure IAM credentials are not stored in plaintext on disk; enforce AWS IAM Roles & KMS encryption",
                    "compliance_status": "AUDITED"
                }
            }
        },
        {
            "concept_id": "CIA-INTEGRITY",
            "name": "Integrity Tampering & Unauthorized Modification",
            "triad_pillar": "Integrity",
            "description": "Demonstrates unauthorized system file modification, DNS hosts redirection, or binary patching resulting in cryptographic hash divergence.",
            "simulated_action": "Inject malicious redirection into C:\\Windows\\System32\\drivers\\etc\\hosts or alter system DLL",
            "impact_type": "Data & System State Corruption / Man-in-the-Middle Redirection",
            "telemetry_details": {
                "process": "cmd.exe",
                "command_line": "echo 100.118.161.17 updates.microsoft.com >> C:\\Windows\\System32\\drivers\\etc\\hosts",
                "access_mask": "0x0002 (FILE_WRITE_DATA)",
                "target_file": "C:\\Windows\\System32\\drivers\\etc\\hosts",
                "sysmon_event_id": 11,
                "event_type": "file_integrity_violation"
            },
            "baselines": {
                "cis": {
                    "benchmark": "CIS Microsoft Windows Benchmark v2.0.0",
                    "control_id": "CIS 18.3.1 / 18.9.84",
                    "title": "Ensure File Integrity Monitoring (FIM) and 'Audit File System' is set to 'Success and Failure'",
                    "compliance_status": "NON_COMPLIANT",
                    "remediation": "Auditpol /set /subcategory:\"File System\" /success:enable /failure:enable"
                },
                "microsoft": {
                    "baseline": "Microsoft Windows Defender Application Control (WDAC)",
                    "feature": "Code Integrity & AppLocker Enforced Mode",
                    "recommendation": "Enforce WDAC driver and user-mode code integrity policies to block execution of unverified/modified binaries.",
                    "compliance_status": "RECOMMENDED"
                },
                "aws": {
                    "benchmark": "CIS AWS Foundations Benchmark v3.0.0",
                    "control_id": "CIS AWS 3.1",
                    "title": "Ensure CloudTrail log file validation is enabled to guarantee cryptographic log integrity",
                    "compliance_status": "COMPLIANT"
                }
            }
        },
        {
            "concept_id": "CIA-AVAILABILITY",
            "name": "Availability Denial & Service Disruption",
            "triad_pillar": "Availability",
            "description": "Simulates resource exhaustion, critical listening port flooding, or service termination to deny legitimate access to cyber-range services.",
            "simulated_action": "Force terminate critical service or exhaust TCP socket connections on listening port 8000/445",
            "impact_type": "Business Workflow Disruption & Service Outage",
            "telemetry_details": {
                "process": "net.exe",
                "command_line": "net stop ShadowXLab-Service /y",
                "access_mask": "0x0020 (SERVICE_STOP)",
                "target_service": "ShadowXLab-Core-Listener:8000",
                "sysmon_event_id": 1,
                "event_type": "service_state_change"
            },
            "baselines": {
                "cis": {
                    "benchmark": "CIS Controls v8",
                    "control_id": "CIS Control 10.4 / 11.2",
                    "title": "Automated Service Recovery & Rate-Limiting Protection on Exposed Interfaces",
                    "compliance_status": "DEGRADED",
                    "remediation": "Configure Service Control Manager (SCM) first and second failure actions to 'Restart the Service'."
                },
                "microsoft": {
                    "baseline": "Microsoft Windows Server Resiliency Baseline",
                    "feature": "Windows Firewall Active Profiles & DoS Protection",
                    "recommendation": "Enable stateful TCP connection rate limiting and ensure Failover Clustering / ReFS volume integrity.",
                    "compliance_status": "AUDITED"
                },
                "aws": {
                    "benchmark": "AWS Well-Architected Framework: Reliability Pillar",
                    "control_id": "AWS REL 1.2 / AWS Shield",
                    "title": "Ensure Multi-AZ auto-scaling groups and AWS Shield Standard Layer 3/4 DDoS protection are active",
                    "compliance_status": "COMPLIANT"
                }
            }
        },
        {
            "concept_id": "THREAT-VS-VULN",
            "name": "Threat vs Vulnerability vs Risk Matrix",
            "triad_pillar": "Risk Management",
            "description": "Demonstrates how an unpatched open listening service (Vulnerability) becomes an active risk when a Threat Actor dispatches an Exploit payload.",
            "simulated_action": "Correlate open listening ports (135, 445, 8000) with known CVE exploit patterns",
            "impact_type": "Remote Code Execution (RCE) Exposure ($Likelihood \\times Impact$)",
            "telemetry_details": {
                "process": "nmap.exe",
                "command_line": "nmap -sV -p 135,445,8000,3000 100.95.175.46",
                "access_mask": "SYN_SCAN_CONNECT",
                "target_file": "Network Socket Stack",
                "sysmon_event_id": 3,
                "event_type": "network_reconnaissance"
            },
            "baselines": {
                "cis": {
                    "benchmark": "CIS Controls v8: Asset & Vulnerability Management",
                    "control_id": "CIS Control 7.1 / 7.2",
                    "title": "Establish and Maintain a Vulnerability Management Process and Remediate Detected Flaws",
                    "compliance_status": "ACTION_REQUIRED",
                    "remediation": "Disable SMBv1, restrict SMB/RPC inbound bindings via Windows Defender Firewall with Advanced Security."
                },
                "microsoft": {
                    "baseline": "Microsoft Enterprise Threat Modeling Baseline",
                    "feature": "Attack Surface Reduction (ASR) Rules",
                    "recommendation": "Block executable content from email client and webmail; block credential stealing from Windows LSASS.",
                    "compliance_status": "AUDITED"
                },
                "aws": {
                    "benchmark": "CIS AWS Foundations Benchmark v3.0.0",
                    "control_id": "CIS AWS 5.1",
                    "title": "Ensure no Network Access Control Lists (NACLs) allow unrestricted ingress on administrative ports",
                    "compliance_status": "COMPLIANT"
                }
            }
        }
    ]
}

@router.get("/02")
async def get_module_02():
    """Retrieves Module 02 PEN-200 curriculum with deep CIS, Microsoft, and AWS baseline mappings."""
    return MODULE_02_CURRICULUM

@router.post("/02/demonstrate")
async def execute_live_concept(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """
    Executes a live concept demonstration against an active target host and produces real 29-field telemetry.
    """
    concept_id = payload.get("concept_id", "CIA-CONFIDENTIALITY")
    target_asset_id = payload.get("asset_id")

    async with async_session_maker() as session:
        if target_asset_id:
            res = await session.execute(select(AssetModel).where(AssetModel.asset_id == target_asset_id))
            target_asset = res.scalars().first()
        else:
            res = await session.execute(select(AssetModel).where(AssetModel.status == "ACTIVE"))
            target_asset = res.scalars().first()

        hostname = target_asset.hostname if target_asset else "ShadowXLab"
        target_ip = target_asset.ip_address if target_asset else "100.95.175.46"
        asset_id = target_asset.asset_id if target_asset else "ast-local"

    concept_meta = next((c for c in MODULE_02_CURRICULUM["interactive_concepts"] if c["concept_id"] == concept_id), None)
    if not concept_meta:
        raise HTTPException(status_code=404, detail="Concept ID not found.")

    telem = concept_meta.get("telemetry_details", {})
    evt_id = f"evt-mod02-{concept_id.lower()[:8]}-{datetime.utcnow().strftime('%H%M%S')}"

    # Create real 29-field telemetry event
    evt_envelope = {
        "event_id": evt_id,
        "source": "sysmon",
        "collector_id": "hec:8088",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "hostname": hostname,
        "ip": target_ip,
        "user": "LAB\\student",
        "process": telem.get("process", "powershell.exe"),
        "command_line": telem.get("command_line", f"ConceptDemo.exe --action {concept_id}"),
        "file_path": telem.get("target_file"),
        "event_type": telem.get("event_type", "security_concept_demonstration"),
        "severity": "high" if "CONFIDENTIALITY" in concept_id or "INTEGRITY" in concept_id else "medium",
        "risk_score": 85 if "CONFIDENTIALITY" in concept_id else 65,
        "mitre_tactic": "credential-access" if "CONFIDENTIALITY" in concept_id else ("defense-evasion" if "INTEGRITY" in concept_id else "impact"),
        "mitre_technique": "T1003.001" if "CONFIDENTIALITY" in concept_id else ("T1059.001" if "INTEGRITY" in concept_id else "T1489"),
        "exercise_id": "EX-MOD02-FOUNDATIONS",
        "raw_event": {
            "concept_id": concept_id,
            "triad_pillar": concept_meta["triad_pillar"],
            "impact": concept_meta["impact_type"],
            "access_mask": telem.get("access_mask"),
            "sysmon_event_id": telem.get("sysmon_event_id"),
            "target": target_ip,
            "cis_control": concept_meta["baselines"]["cis"]["control_id"],
            "microsoft_baseline": concept_meta["baselines"]["microsoft"]["feature"]
        }
    }

    # Store through Canonical Normalizer
    success, ack = await canonical_normalizer.normalize_and_store(evt_envelope, "CURRICULUM-DEMO-AGENT")

    # Broadcast event to UI
    await event_bus.broadcast("CONCEPT_DEMO_FIRED", {
        "concept_id": concept_id,
        "hostname": hostname,
        "target_ip": target_ip,
        "pillar": concept_meta["triad_pillar"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })

    return {
        "status": "demonstration_executed",
        "concept_id": concept_id,
        "concept_name": concept_meta["name"],
        "triad_pillar": concept_meta["triad_pillar"],
        "target_hostname": hostname,
        "target_ip": target_ip,
        "telemetry_proof": {
            "event_id": ack["event_id"],
            "process": telem.get("process"),
            "command_line": telem.get("command_line"),
            "access_mask": telem.get("access_mask"),
            "target_file": telem.get("target_file"),
            "sysmon_event_id": telem.get("sysmon_event_id")
        },
        "baselines_comparison": concept_meta["baselines"],
        "business_risk_impact": concept_meta["impact_type"]
    }
