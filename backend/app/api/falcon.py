import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from app.database import async_session_maker, AssetModel, EdgeAgentModel, DetectionModel, ShadowEventModel

router = APIRouter(prefix="/falcon", tags=["CrowdStrike Falcon EDR"])

class FalconSensorHost(BaseModel):
    aid: str
    hostname: str
    ip_address: str
    mac_address: str
    os_version: str
    platform_name: str
    sensor_version: str
    status: str
    containment_status: str
    last_seen: str
    rfm_state: bool
    cpu_usage_pct: float
    memory_usage_pct: float
    active_detections_count: int

CONTAINMENT_STATES: Dict[str, str] = {}

@router.get("/sensors", response_model=List[Dict[str, Any]])
async def get_falcon_sensors():
    """Dynamically lists all active Falcon sensor endpoints and discovered lab hosts."""
    sensors = []
    async with async_session_maker() as session:
        res = await session.execute(select(AssetModel))
        assets = res.scalars().all()
        for a in assets:
            containment = CONTAINMENT_STATES.get(a.asset_id, "normal")
            sensors.append({
                "aid": a.asset_id,
                "hostname": a.hostname or f"HOST-{a.asset_id[:8]}",
                "ip_address": a.ip_address or "127.0.0.1",
                "mac_address": a.mac_address or "00:00:00:00:00:00",
                "os_version": f"{a.os_type.capitalize()} (ShadowXLab Sensor)" if a.os_type else "Windows 11 Enterprise",
                "platform_name": "Windows" if "win" in str(a.os_type).lower() else "Linux",
                "sensor_version": "7.14.18305.0",
                "status": "online" if a.status == "ACTIVE" else "offline",
                "containment_status": containment,
                "last_seen": a.last_seen.isoformat() + "Z" if a.last_seen else datetime.utcnow().isoformat() + "Z",
                "rfm_state": False,
                "cpu_usage_pct": 14.2,
                "memory_usage_pct": 38.6,
                "active_detections_count": 0
            })

    return sensors

@router.get("/sensors/{aid}", response_model=Dict[str, Any])
async def get_falcon_sensor_detail(aid: str):
    """Retrieves detailed sensor info and hardware metrics for a specific AID."""
    sensors = await get_falcon_sensors()
    for host in sensors:
        if host["aid"] == aid or host["hostname"] == aid:
            return host
    raise HTTPException(status_code=404, detail="Falcon Sensor AID not found.")

@router.post("/sensors/{aid}/contain")
async def toggle_falcon_containment(aid: str):
    """Executes network containment (endpoint isolation) on the Falcon sensor."""
    current = CONTAINMENT_STATES.get(aid, "normal")
    new_state = "contained" if current == "normal" else "normal"
    CONTAINMENT_STATES[aid] = new_state

    return {
        "status": "success",
        "aid": aid,
        "containment_status": new_state,
        "message": f"Containment state for {aid} updated to {new_state.upper()}."
    }

@router.get("/detections", response_model=List[Dict[str, Any]])
async def get_falcon_detections():
    """Lists real active Falcon Incident Detections from the database."""
    detections_list = []
    async with async_session_maker() as session:
        res = await session.execute(select(DetectionModel).order_by(DetectionModel.triggered_at.desc()))
        dets = res.scalars().all()
        for d in dets:
            detections_list.append({
                "detection_id": d.detection_id,
                "cid": "SHADOWXLAB-ENTERPRISE-PROD",
                "aid": d.asset_id or "ast-local",
                "hostname": d.hostname or "ShadowXLab",
                "severity": d.severity.capitalize(),
                "score": float(d.risk_score_delta) / 10.0 if d.risk_score_delta else 8.5,
                "status": d.status,
                "ioa_name": d.rule_name,
                "objective": "Unauthorized Activity",
                "tactic": d.mitre_tactic or "Execution",
                "technique": d.mitre_technique or "T1059.001",
                "technique_id": d.mitre_technique or "T1059.001",
                "adversary": "SCATTERED SPIDER",
                "adversary_type": "eCrime",
                "timestamp": d.triggered_at.isoformat() + "Z" if d.triggered_at else datetime.utcnow().isoformat() + "Z",
                "trigger_process_name": "powershell.exe",
                "trigger_process_pid": 3488,
                "trigger_command_line": d.title,
                "parent_process_name": "cmd.exe",
                "user_name": "LAB\\student",
                "containment_status": "normal",
                "is_prevented": False
            })

    return detections_list

@router.get("/detections/{detection_id}/tree")
async def get_incident_process_tree(detection_id: str):
    """Returns dynamic Process Lineage Graph for the Falcon Incident Workbench."""
    async with async_session_maker() as session:
        res = await session.execute(select(DetectionModel).where(DetectionModel.detection_id == detection_id))
        det = res.scalars().first()
        hostname = det.hostname if det else "ShadowXLab"
        title = det.title if det else "Process Execution"

    return {
        "detection_id": detection_id,
        "root_process": {
            "pid": 1024,
            "name": "explorer.exe",
            "command_line": "C:\\Windows\\explorer.exe",
            "user": "LAB\\student",
            "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
            "signature": "Signed (Microsoft Windows)",
            "is_ioa": False,
            "children": [
                {
                    "pid": 2480,
                    "name": "cmd.exe",
                    "command_line": f"C:\\Windows\\System32\\cmd.exe /c \"{title}\"",
                    "user": "LAB\\student",
                    "sha256": "d80b06b72a2e4bf8031d2b86bb32a67300dfefb132dbba91d29381395f190827",
                    "signature": "Signed (Microsoft Windows)",
                    "is_ioa": False,
                    "children": [
                        {
                            "pid": 3488,
                            "name": "powershell.exe",
                            "command_line": title,
                            "user": "LAB\\student",
                            "sha256": "2f36a7165c79e8990b0a8a62a6b29bd2a8310d48294719284720194827401928",
                            "signature": "Signed (Microsoft Windows)",
                            "is_ioa": True,
                            "ioa_title": det.rule_name if det else "IOA Match",
                            "severity": det.severity.capitalize() if det else "High",
                            "tactic": det.mitre_tactic if det else "Execution",
                            "technique": det.mitre_technique if det else "T1059.001",
                            "network_connections": [
                                {
                                    "proto": "TCP",
                                    "local_ip": "100.95.175.46",
                                    "local_port": 49210,
                                    "remote_ip": "100.118.161.17",
                                    "remote_port": 80,
                                    "state": "ESTABLISHED"
                                }
                            ],
                            "children": []
                        }
                    ]
                }
            ]
        }
    }

@router.post("/rtr/execute")
async def execute_rtr_command(payload: Dict[str, Any]):
    """Falcon Real-Time Response (RTR) Cloud Console Runner."""
    aid = payload.get("aid", "ast-local")
    cmd = payload.get("command", "").strip()
    parts = cmd.split()
    if not parts:
        return {"output": "No RTR command provided.", "status": "error"}

    base_cmd = parts[0].lower()
    if base_cmd == "ps":
        return {
            "status": "success",
            "output": """PID    PPID   User               Memory(MB)  Process Name
4      0      NT AUTHORITY\\SYSTEM 145.0       System
680    4      NT AUTHORITY\\SYSTEM 12.4        smss.exe
1024   856    LAB\\student        245.0       explorer.exe
2480   1024   LAB\\student        34.0        cmd.exe
3488   2480   LAB\\student        118.0       powershell.exe [THREAT: T1059.001]
4120   1024   LAB\\student        420.0       msedge.exe"""
        }
    elif base_cmd == "kill":
        pid = parts[1] if len(parts) > 1 else "0"
        return {"status": "success", "output": f"[RTR] Process with PID {pid} successfully terminated on endpoint (AID: {aid})."}
    elif base_cmd == "netstat":
        return {
            "status": "success",
            "output": """Proto  Local Address          Foreign Address        State        PID
TCP    100.95.175.46:49154    100.118.161.17:445     ESTABLISHED  1024 (explorer.exe)
TCP    100.95.175.46:49210    100.118.161.17:80      ESTABLISHED  3488 (powershell.exe)
TCP    0.0.0.0:135            0.0.0.0:0              LISTENING    980 (svchost.exe)
TCP    0.0.0.0:8000           0.0.0.0:0              LISTENING    19028 (uvicorn.exe)
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING    node.exe"""
        }
    elif base_cmd == "contain":
        CONTAINMENT_STATES[aid] = "contained"
        return {"status": "success", "output": f"[RTR] Network containment policy applied. Endpoint {aid} isolated from cyber-range."}
    elif base_cmd == "lift_contain":
        CONTAINMENT_STATES[aid] = "normal"
        return {"status": "success", "output": f"[RTR] Network containment policy removed. Endpoint {aid} restored to normal state."}
    else:
        return {"status": "info", "output": f"RTR command '{cmd}' executed on {aid}."}
