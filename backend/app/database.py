import uuid
from datetime import datetime
from typing import AsyncGenerator
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey, Table
)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, relationship
from app.config import settings

Base = declarative_base()

class EdgeAgentModel(Base):
    """Registered Edge Agents running inside customer lab networks."""
    __tablename__ = "edge_agents"
    
    agent_id = Column(String(64), primary_key=True, default=lambda: f"AGENT-{uuid.uuid4().hex[:8].upper()}")
    installation_id = Column(String(128), nullable=False, unique=True, index=True)
    hostname = Column(String(255), nullable=True)
    local_ip = Column(String(45), nullable=True)
    agent_version = Column(String(32), default="1.0.0")
    
    # Cryptographic Identity & Certificate Lifecycle
    public_key_pem = Column(Text, nullable=True)
    certificate_pem = Column(Text, nullable=True)
    certificate_fingerprint = Column(String(128), nullable=True, index=True)
    certificate_expires_at = Column(DateTime, nullable=True)
    registration_token = Column(String(128), nullable=True, index=True)
    
    # Operational Status
    status = Column(String(32), default="PAIRING") # PAIRING, CONNECTED, DEGRADED, DISCONNECTED, REVOKED, ERROR
    is_revoked = Column(Boolean, default=False)
    revocation_reason = Column(String(255), nullable=True)
    last_heartbeat = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Active Connectors on this Edge Agent
    connectors_summary = Column(JSON, default=dict) # {"proxmox": "connected", "vbox": "disabled", "syslog": "active"}

class AssetModel(Base):
    """Discovered infrastructure assets with 5-stage lifecycle."""
    __tablename__ = "assets"
    
    asset_id = Column(String(64), primary_key=True, default=lambda: f"ast-{uuid.uuid4().hex[:12]}")
    hostname = Column(String(255), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True, index=True)
    mac_address = Column(String(30), nullable=True, index=True)
    os_type = Column(String(64), nullable=True) # windows, linux, kali, appliance
    os_version = Column(String(255), nullable=True)
    
    # 5-Stage Asset Lifecycle: DISCOVERED, ACTIVE, DEGRADED, OFFLINE, REMOVED
    status = Column(String(32), default="DISCOVERED", index=True)
    confidence_score = Column(Float, default=0.5) # 0.0 to 1.0
    discovery_source = Column(String(128), default="qemu_agent") # qemu_agent, vbox_agent, arp, passive_sniff, manual
    
    # Hypervisor Linkage
    hypervisor_type = Column(String(32), nullable=True) # proxmox, virtualbox, physical
    hypervisor_node = Column(String(128), nullable=True)
    vmid = Column(String(64), nullable=True, index=True) # Proxmox VMID or VBox UUID
    vm_status = Column(String(32), nullable=True) # running, stopped, paused
    
    agent_id = Column(String(64), ForeignKey("edge_agents.agent_id", ondelete="SET NULL"), nullable=True)
    open_ports = Column(JSON, default=list)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow, index=True)
    is_lab_isolated = Column(Boolean, default=False)
    metadata_json = Column(JSON, default=dict)

class ShadowEventModel(Base):
    """Canonical 29-Field ShadowEvent Schema."""
    __tablename__ = "events"
    
    event_id = Column(String(64), primary_key=True, default=lambda: f"evt-{uuid.uuid4().hex[:12]}")
    schema_version = Column(String(16), default="1.0")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source = Column(String(64), index=True) # sysmon, auditd, zeek, splunk, pve, winrm
    collector = Column(String(64)) # syslog:514, hec:8088, rest:8000, passive_sniff
    asset_id = Column(String(64), ForeignKey("assets.asset_id", ondelete="SET NULL"), nullable=True, index=True)
    hostname = Column(String(255), nullable=True, index=True)
    ip = Column(String(45), nullable=True, index=True)
    mac = Column(String(30), nullable=True)
    user = Column(String(128), nullable=True, index=True)
    process = Column(String(255), nullable=True)
    parent_process = Column(String(255), nullable=True)
    command_line = Column(Text, nullable=True)
    file_path = Column(String(512), nullable=True)
    file_hash = Column(String(128), nullable=True)
    src_ip = Column(String(45), nullable=True)
    src_port = Column(Integer, nullable=True)
    dst_ip = Column(String(45), nullable=True)
    dst_port = Column(Integer, nullable=True)
    protocol = Column(String(32), nullable=True)
    event_type = Column(String(64), index=True)
    severity = Column(String(32), default="info", index=True) # info, low, medium, high, critical
    confidence = Column(Float, default=1.0)
    risk_score = Column(Integer, default=0)
    mitre_tactic = Column(String(64), nullable=True, index=True)
    mitre_technique = Column(String(64), nullable=True, index=True)
    exercise_id = Column(String(64), nullable=True, index=True)
    action_id = Column(String(64), nullable=True, index=True)
    raw_event = Column(JSON, default=dict)
    correlation_id = Column(String(64), nullable=True, index=True)

class DetectionModel(Base):
    """Sigma & Engine Alert Detections."""
    __tablename__ = "detections"
    
    detection_id = Column(String(64), primary_key=True, default=lambda: f"det-{uuid.uuid4().hex[:12]}")
    title = Column(String(255), nullable=False)
    rule_name = Column(String(255), nullable=False, index=True)
    rule_type = Column(String(32), default="sigma")
    severity = Column(String(32), default="medium")
    mitre_tactic = Column(String(64), nullable=True)
    mitre_technique = Column(String(64), nullable=True, index=True)
    triggered_at = Column(DateTime, default=datetime.utcnow, index=True)
    event_id = Column(String(64), ForeignKey("events.event_id", ondelete="CASCADE"), nullable=True)
    asset_id = Column(String(64), ForeignKey("assets.asset_id", ondelete="SET NULL"), nullable=True)
    hostname = Column(String(255), nullable=True)
    status = Column(String(32), default="new") # new, under_investigation, resolved, false_positive
    risk_score_delta = Column(Integer, default=25)
    details = Column(JSON, default=dict)

class IncidentCaseModel(Base):
    """SOC Incident Cases with Evidence Provenance."""
    __tablename__ = "cases"
    
    case_id = Column(String(64), primary_key=True, default=lambda: f"CASE-PX-{uuid.uuid4().hex[:6].upper()}")
    title = Column(String(255), nullable=False)
    severity = Column(String(32), default="medium")
    status = Column(String(32), default="open") # open, investigating, contained, closed
    lead_analyst = Column(String(128), nullable=True)
    target_asset_id = Column(String(64), ForeignKey("assets.asset_id", ondelete="SET NULL"), nullable=True)
    target_hostname = Column(String(255), nullable=True)
    exercise_id = Column(String(64), nullable=True, index=True)
    
    # Formal Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    investigation_started_at = Column(DateTime, nullable=True)
    investigation_completed_at = Column(DateTime, nullable=True)
    contained_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    # Latency Metrics (Seconds)
    ttd_seconds = Column(Float, nullable=True) # Time to Detect
    tta_seconds = Column(Float, nullable=True) # Time to Acknowledge
    tti_seconds = Column(Float, nullable=True) # Time to Investigate
    ttr_seconds = Column(Float, nullable=True) # Time to Respond
    
    timeline_events = Column(JSON, default=list)
    evidence_ids = Column(JSON, default=dict)
    notes = Column(Text, nullable=True)

class PurpleExerciseModel(Base):
    """Purple Team Exercises with Evidence-Backed Scoring."""
    __tablename__ = "purple_exercises"
    
    exercise_id = Column(String(64), primary_key=True, default=lambda: f"EX-{uuid.uuid4().hex[:8].upper()}")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    mitre_technique = Column(String(64), nullable=False, index=True)
    technique_name = Column(String(255), nullable=False)
    target_asset_id = Column(String(64), ForeignKey("assets.asset_id", ondelete="SET NULL"), nullable=True)
    target_hostname = Column(String(255), nullable=True)
    target_ip = Column(String(45), nullable=True)
    operator_user = Column(String(128), default="red_operator")
    status = Column(String(32), default="pending") # pending, executing, analyzing, validated, completed, failed
    
    # Exact Stage Timestamps
    t_action = Column(DateTime, nullable=True)
    t_telemetry = Column(DateTime, nullable=True)
    t_detection = Column(DateTime, nullable=True)
    t_ack = Column(DateTime, nullable=True)
    t_inv_start = Column(DateTime, nullable=True)
    t_inv_done = Column(DateTime, nullable=True)
    t_resp_done = Column(DateTime, nullable=True)
    
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Evidence-Backed Scores (0 to 100 max)
    telemetry_score = Column(Float, default=0.0) # max 35.0
    detection_score = Column(Float, default=0.0) # max 30.0
    investigation_score = Column(Float, default=0.0) # max 20.0
    response_score = Column(Float, default=0.0) # max 15.0
    total_purple_score = Column(Float, default=0.0) # max 100.0
    
    evidence_proof = Column(JSON, default=dict)
    red_command = Column(Text, nullable=True)
    red_output = Column(Text, nullable=True)
    execution_protocol = Column(String(32), default="winrm")
    improvement_recommendations = Column(JSON, default=list)

class ConnectorModel(Base):
    """Hypervisor & SIEM Connectors Status."""
    __tablename__ = "connectors"
    
    connector_id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    connector_type = Column(String(64), nullable=False)
    is_enabled = Column(Boolean, default=True)
    status = Column(String(32), default="disconnected") # connected, degraded, disconnected, unauthorized
    host = Column(String(255), nullable=True)
    port = Column(Integer, nullable=True)
    encrypted_credentials = Column(Text, nullable=True)
    last_check_time = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    details = Column(JSON, default=dict)

class UserAccountModel(Base):
    """Role-Based Access Control (RBAC) Accounts."""
    __tablename__ = "users"
    
    user_id = Column(String(64), primary_key=True, default=lambda: f"usr-{uuid.uuid4().hex[:8]}")
    username = Column(String(64), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(128), nullable=True)
    role = Column(String(32), default="STUDENT") # ADMIN, INSTRUCTOR, RED_TEAM, BLUE_TEAM, PURPLE_TEAM, STUDENT, VIEWER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
