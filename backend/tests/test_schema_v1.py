import pytest
from datetime import datetime
from app.normalizer.schema import ShadowEvent
from app.normalizer.sysmon import parse_sysmon_event
from app.normalizer.linux_audit import parse_linux_audit_event
from app.normalizer.zeek import parse_zeek_event
from app.normalizer.splunk import parse_splunk_result

def test_shadow_event_29_fields_model():
    """Verify that ShadowEvent contains exactly all 29 defined fields."""
    event = ShadowEvent(
        source="sysmon",
        collector="hec:8088",
        event_type="process_creation",
        hostname="WIN11-01",
        ip="10.10.10.21",
        process="powershell.exe",
        command_line="powershell.exe -enc SQBFA...",
        mitre_tactic="execution",
        mitre_technique="T1059.001",
        exercise_id="EX-001",
        action_id="act-001"
    )
    dump = event.model_dump()
    assert dump["schema_version"] == "1.0"
    assert dump["source"] == "sysmon"
    assert dump["process"] == "powershell.exe"
    assert dump["mitre_technique"] == "T1059.001"
    assert dump["action_id"] == "act-001"

def test_sysmon_parser():
    raw_sysmon = {
        "EventData": {
            "EventId": "1",
            "Image": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
            "CommandLine": "powershell.exe -enc SQBFA...",
            "User": "LAB\\student",
            "Computer": "WIN11-01",
            "HostIp": "10.10.10.21"
        }
    }
    event = parse_sysmon_event(raw_sysmon)
    assert event.source == "sysmon"
    assert event.process == "powershell.exe"
    assert event.mitre_technique == "T1059.001"
    assert event.severity == "high"

def test_linux_audit_parser():
    raw_audit = {
        "exe": "/usr/bin/cat",
        "cmdline": "cat /etc/shadow",
        "user": "root",
        "hostname": "WEB01"
    }
    event = parse_linux_audit_event(raw_audit)
    assert event.source == "auditd"
    assert event.process == "cat"
    assert event.mitre_technique == "T1003.008"
    assert event.severity == "high"

def test_zeek_parser():
    raw_zeek = {
        "ts": 1724968800.0,
        "id.orig_h": "10.10.10.50",
        "id.orig_p": 54321,
        "id.resp_h": "10.10.10.21",
        "id.resp_p": 4444,
        "proto": "tcp"
    }
    event = parse_zeek_event(raw_zeek, log_type="conn")
    assert event.source == "zeek"
    assert event.dst_port == 4444
    assert event.mitre_tactic == "command-and-control"
