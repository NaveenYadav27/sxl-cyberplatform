from fastapi import APIRouter, Body, HTTPException, Depends
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from app.database import async_session_maker, AssetModel
from app.compliance.wazuh_sca_scanner import sca_scanner
from app.websocket.event_bus import event_bus

router = APIRouter(prefix="/compliance", tags=["Security Configuration Assessment & Baseline Scanner"])

LATEST_SCAN_CACHE: Dict[str, Any] = {}

@router.get("/scans")
async def get_latest_compliance_scan() -> Dict[str, Any]:
    """Retrieves the latest Wazuh SCA / Azure Security Benchmark baseline scan results."""
    global LATEST_SCAN_CACHE
    if not LATEST_SCAN_CACHE:
        # Run initial scan on connected asset
        async with async_session_maker() as session:
            res = await session.execute(select(AssetModel).where(AssetModel.status == "ACTIVE"))
            asset = res.scalars().first()
            hostname = asset.hostname if asset else "ShadowXLab"
            ip = asset.ip_address if asset else "100.95.175.46"

        LATEST_SCAN_CACHE = sca_scanner.scan_endpoint(hostname, ip)

    return LATEST_SCAN_CACHE

@router.post("/scan")
async def trigger_live_baseline_scan(payload: Dict[str, Any] = Body(default={})) -> Dict[str, Any]:
    """
    Executes a real-time Security Configuration Assessment (SCA) scan against the connected endpoint.
    Audits LSA Protection, SMBv1, NLA, UAC, ScriptBlock logging, Firewall, and open attack surfaces.
    """
    global LATEST_SCAN_CACHE
    asset_id = payload.get("asset_id")

    async with async_session_maker() as session:
        if asset_id:
            res = await session.execute(select(AssetModel).where(AssetModel.asset_id == asset_id))
            asset = res.scalars().first()
        else:
            res = await session.execute(select(AssetModel).where(AssetModel.status == "ACTIVE"))
            asset = res.scalars().first()

        hostname = asset.hostname if asset else "ShadowXLab"
        ip = asset.ip_address if asset else "100.95.175.46"

    scan_result = sca_scanner.scan_endpoint(hostname, ip)
    LATEST_SCAN_CACHE = scan_result

    # Broadcast updated compliance scan to UI
    await event_bus.broadcast("COMPLIANCE_SCAN_COMPLETED", {
        "scan_id": scan_result["scan_id"],
        "compliance_score": scan_result["compliance_score"],
        "failed_count": scan_result["failed_count"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })

    return scan_result

@router.get("/remediation/{rule_id}")
async def get_remediation_guidance(rule_id: str) -> Dict[str, Any]:
    """Retrieves step-by-step hardening commands for a failed baseline check."""
    global LATEST_SCAN_CACHE
    if not LATEST_SCAN_CACHE:
        LATEST_SCAN_CACHE = sca_scanner.scan_endpoint()

    check = next((c for c in LATEST_SCAN_CACHE.get("checks", []) if c["rule_id"] == rule_id), None)
    if not check:
        raise HTTPException(status_code=404, detail="Rule ID not found in baseline checks.")

    return {
        "rule_id": rule_id,
        "title": check["title"],
        "benchmark": check["benchmark"],
        "pillar": check["pillar"],
        "remediation_script": check["remediation"],
        "instructions": f"Run the following command in an elevated PowerShell terminal on {LATEST_SCAN_CACHE.get('hostname')}:"
    }
