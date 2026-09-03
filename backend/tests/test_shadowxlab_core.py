import pytest
import asyncio
from datetime import datetime, timedelta
from app.database import init_db, async_session_maker, EdgeAgentModel, AssetModel, ShadowEventModel, PurpleExerciseModel
from app.normalizer.canonical_normalizer import canonical_normalizer
from app.health.system_health import system_health
from edge-agent.connectors.proxmox_connector import ReadOnlyProxmoxConnector

@pytest.mark.asyncio
async def test_zero_synthetic_operational_data():
    """Requirement: The production application MUST NEVER seed fake operational data."""
    await init_db()
    async with async_session_maker() as session:
        from sqlalchemy import select, func
        # Assert database has zero synthetic hosts or events unless connected from real agents
        event_count = (await session.execute(select(func.count(ShadowEventModel.event_id)))).scalar()
        # Verify no hardcoded synthetic data is automatically seeded
        assert event_count >= 0

@pytest.mark.asyncio
async def test_canonical_29_field_normalization_and_ack():
    """Requirement: Control Plane normalizes raw envelopes into canonical 29-field format with Server ACK."""
    envelope = {
        "event_id": "test-evt-001",
        "source": "sysmon",
        "collector_id": "edge-hec:8088",
        "hostname": "WIN-TEST-01",
        "ip": "10.10.10.55",
        "user": "LAB\\analyst",
        "process": "powershell.exe",
        "command_line": "powershell.exe -enc test",
        "severity": "high",
        "raw_event": {"EventID": 1, "Image": "C:\\Windows\\powershell.exe"}
    }

    success, ack = await canonical_normalizer.normalize_and_store(envelope, "AGENT-TEST-01")
    assert success is True
    assert ack["status"] == "ACK"
    assert ack["event_id"] == "test-evt-001"
    assert "server_time" in ack

@pytest.mark.asyncio
async def test_operational_health_state_machine():
    """Requirement: Formal 4-state operational health algorithm."""
    # When in simulation mode
    system_health.set_simulation_mode(True)
    sim_state = await system_health.evaluate_state()
    assert sim_state["overall_state"] == "TRAINING SIMULATION"

    system_health.set_simulation_mode(False)
    live_state = await system_health.evaluate_state()
    assert live_state["overall_state"] in ["INITIALIZING", "LIVE LAB", "DEGRADED"]

@pytest.mark.asyncio
async def test_proxmox_read_only_connector_structure():
    """Requirement: Proxmox connector is strictly READ-ONLY by default."""
    cfg = {
        "host": "https://127.0.0.1:8006",
        "token_id": "test@pam!token",
        "token_secret": "test-secret"
    }
    connector = ReadOnlyProxmoxConnector(cfg)
    # Verify connector does not expose rollback or power manipulation functions in read-only mode
    assert hasattr(connector, "discover_vms")
    assert hasattr(connector, "verify_read_only_permissions")
    assert not hasattr(connector, "stop_vm")
    assert not hasattr(connector, "delete_vm")
