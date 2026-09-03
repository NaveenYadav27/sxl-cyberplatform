import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from sqlalchemy import select

from app.database import async_session_maker, EdgeAgentModel, AssetModel, get_db
from app.auth.security import get_current_user
from app.websocket.event_bus import event_bus

router = APIRouter(prefix="/agents", tags=["Edge Agent Management & Certificate Lifecycle"])

ACTIVE_PAIRING_TOKENS: Dict[str, Dict[str, Any]] = {}

class AgentPairingRequest(BaseModel):
    installation_id: str
    hostname: str
    local_ip: str
    agent_version: str = "1.0.0"
    public_key_pem: str
    pairing_token: str

class AgentHeartbeatRequest(BaseModel):
    installation_id: str
    connectors: Dict[str, Any] = {}
    timestamp: str

@router.post("/token")
async def generate_pairing_token() -> Dict[str, Any]:
    """Generates a secure, one-time pairing token for deploying a new Edge Agent."""
    token = f"px-pair-{uuid.uuid4().hex[:16]}"
    expires_at = datetime.utcnow() + timedelta(hours=2)
    ACTIVE_PAIRING_TOKENS[token] = {
        "created_at": datetime.utcnow(),
        "expires_at": expires_at,
        "is_used": False
    }
    return {
        "status": "success",
        "pairing_token": token,
        "expires_at": expires_at.isoformat() + "Z",
        "instructions": f"cd edge-agent; python agent.py --token {token}"
    }

@router.post("/pair")
async def pair_edge_agent(payload: AgentPairingRequest) -> Dict[str, Any]:
    """
    Exchanges one-time pairing token and Agent public key for a signed X.509 Certificate and Agent ID.
    Registers the host machine as an ACTIVE Target Asset in the Asset Registry.
    """
    token_entry = ACTIVE_PAIRING_TOKENS.get(payload.pairing_token)
    if not token_entry or token_entry.get("is_used") or datetime.utcnow() > token_entry.get("expires_at"):
        raise HTTPException(status_code=401, detail="Invalid, expired, or already used pairing token.")

    token_entry["is_used"] = True

    # Generate certificate fingerprint from public key
    fingerprint = hashlib.sha256(payload.public_key_pem.encode()).hexdigest()
    agent_id = f"AGENT-{uuid.uuid4().hex[:8].upper()}"
    cert_expires = datetime.utcnow() + timedelta(days=90)

    # Simplified X.509 cert representation for agent handshake
    signed_cert = f"-----BEGIN SHADOWXLAB AGENT CERTIFICATE-----\nAGENT_ID:{agent_id}\nINSTALL_ID:{payload.installation_id}\nEXPIRES:{cert_expires.isoformat()}\nFP:{fingerprint[:32]}\n-----END SHADOWXLAB AGENT CERTIFICATE-----"

    async with async_session_maker() as session:
        # 1. Register or update Edge Agent
        existing = await session.execute(
            select(EdgeAgentModel).where(EdgeAgentModel.installation_id == payload.installation_id)
        )
        agent_obj = existing.scalars().first()
        if agent_obj:
            agent_obj.agent_id = agent_id
            agent_obj.hostname = payload.hostname
            agent_obj.local_ip = payload.local_ip
            agent_obj.public_key_pem = payload.public_key_pem
            agent_obj.certificate_pem = signed_cert
            agent_obj.certificate_fingerprint = fingerprint
            agent_obj.certificate_expires_at = cert_expires
            agent_obj.status = "CONNECTED"
            agent_obj.is_revoked = False
            agent_obj.last_heartbeat = datetime.utcnow()
        else:
            agent_obj = EdgeAgentModel(
                agent_id=agent_id,
                installation_id=payload.installation_id,
                hostname=payload.hostname,
                local_ip=payload.local_ip,
                agent_version=payload.agent_version,
                public_key_pem=payload.public_key_pem,
                certificate_pem=signed_cert,
                certificate_fingerprint=fingerprint,
                certificate_expires_at=cert_expires,
                registration_token=payload.pairing_token,
                status="CONNECTED",
                is_revoked=False,
                last_heartbeat=datetime.utcnow()
            )
            session.add(agent_obj)

        # 2. Register or update Host Machine as an ACTIVE Asset
        asset_res = await session.execute(
            select(AssetModel).where(
                (AssetModel.hostname == payload.hostname) |
                (AssetModel.ip_address == payload.local_ip)
            )
        )
        host_asset = asset_res.scalars().first()
        if host_asset:
            host_asset.status = "ACTIVE"
            host_asset.last_seen = datetime.utcnow()
            host_asset.agent_id = agent_id
            host_asset.ip_address = payload.local_ip
            host_asset.hostname = payload.hostname
        else:
            host_asset = AssetModel(
                hostname=payload.hostname,
                ip_address=payload.local_ip,
                os_type="windows" if "win" in payload.hostname.lower() or "shadow" in payload.hostname.lower() else "linux",
                status="ACTIVE",
                confidence_score=1.0,
                discovery_source="edge_agent",
                hypervisor_type="physical",
                agent_id=agent_id,
                first_seen=datetime.utcnow(),
                last_seen=datetime.utcnow()
            )
            session.add(host_asset)

        await session.commit()

    # Broadcast updated asset list
    await event_bus.broadcast("ASSETS_UPDATED", {"timestamp": datetime.utcnow().isoformat() + "Z"})

    return {
        "status": "paired",
        "agent_id": agent_id,
        "certificate_pem": signed_cert,
        "certificate_fingerprint": fingerprint,
        "certificate_expires_at": cert_expires.isoformat() + "Z",
        "control_plane_wss": "ws://127.0.0.1:8000/ws/agent"
    }

@router.get("/")
async def list_edge_agents() -> List[Dict[str, Any]]:
    """Lists all registered Edge Agents with certificate validity and live connection states."""
    async with async_session_maker() as session:
        res = await session.execute(select(EdgeAgentModel))
        agents = res.scalars().all()
        results = []
        for a in agents:
            is_fresh = False
            freshness_str = "DISCONNECTED"
            if a.last_heartbeat:
                delta_s = (datetime.utcnow() - a.last_heartbeat).total_seconds()
                if delta_s <= 60 and not a.is_revoked:
                    is_fresh = True
                    freshness_str = "CONNECTED"
                elif a.is_revoked:
                    freshness_str = "REVOKED"
                else:
                    freshness_str = "DEGRADED" if delta_s <= 180 else "DISCONNECTED"

            results.append({
                "agent_id": a.agent_id,
                "installation_id": a.installation_id,
                "hostname": a.hostname,
                "local_ip": a.local_ip,
                "agent_version": a.agent_version,
                "status": freshness_str,
                "is_revoked": a.is_revoked,
                "certificate_fingerprint": a.certificate_fingerprint,
                "certificate_expires_at": a.certificate_expires_at.isoformat() + "Z" if a.certificate_expires_at else None,
                "last_heartbeat": a.last_heartbeat.isoformat() + "Z" if a.last_heartbeat else None,
                "connectors_summary": a.connectors_summary or {}
            })
        return results

@router.post("/{agent_id}/revoke")
async def revoke_edge_agent(agent_id: str, payload: Dict[str, str] = Body(default={})) -> Dict[str, Any]:
    """Instantly revokes an Edge Agent's certificate and terminates tunnel access."""
    reason = payload.get("reason", "Revoked by administrator")
    async with async_session_maker() as session:
        res = await session.execute(select(EdgeAgentModel).where(EdgeAgentModel.agent_id == agent_id))
        agent_obj = res.scalars().first()
        if not agent_obj:
            raise HTTPException(status_code=404, detail="Agent ID not found.")
        agent_obj.is_revoked = True
        agent_obj.status = "REVOKED"
        agent_obj.revocation_reason = reason
        await session.commit()

    return {
        "status": "success",
        "agent_id": agent_id,
        "message": f"Agent {agent_id} has been revoked. All further WSS frames will be rejected."
    }

@router.post("/{agent_id}/heartbeat")
async def receive_heartbeat(agent_id: str, payload: AgentHeartbeatRequest) -> Dict[str, Any]:
    """Updates Edge Agent heartbeat and connector health summary."""
    async with async_session_maker() as session:
        res = await session.execute(select(EdgeAgentModel).where(EdgeAgentModel.agent_id == agent_id))
        agent_obj = res.scalars().first()
        if not agent_obj:
            raise HTTPException(status_code=404, detail="Agent not registered.")
        if agent_obj.is_revoked:
            raise HTTPException(status_code=403, detail="Agent certificate is revoked.")
        agent_obj.last_heartbeat = datetime.utcnow()
        agent_obj.status = "CONNECTED"
        agent_obj.connectors_summary = payload.connectors

        # Update host asset heartbeat as well
        asset_res = await session.execute(
            select(AssetModel).where(AssetModel.agent_id == agent_id)
        )
        for ast in asset_res.scalars().all():
            ast.last_seen = datetime.utcnow()
            ast.status = "ACTIVE"

        await session.commit()

    return {"status": "ACK", "server_time": datetime.utcnow().isoformat() + "Z"}
