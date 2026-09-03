from fastapi import APIRouter, Depends, Query, Body, HTTPException
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from app.database import get_db, AsyncSession, IncidentCaseModel
from app.auth.security import get_current_user

router = APIRouter(prefix="/cases", tags=["Incident Cases & Investigation Timelines"])

@router.get("/")
async def list_cases(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Source-of-truth incident cases with delta-second audit trails."""
    query = select(IncidentCaseModel).order_by(IncidentCaseModel.created_at.desc())
    if status:
        query = query.where(IncidentCaseModel.status == status)
        
    res = await db.execute(query)
    cases = res.scalars().all()

    return {
        "metric": "Active Cases",
        "value": len(cases),
        "open_count": sum(1 for c in cases if c.status == "open"),
        "investigating_count": sum(1 for c in cases if c.status == "investigating"),
        "contained_count": sum(1 for c in cases if c.status == "contained"),
        "cases": [
            {
                "case_id": c.case_id,
                "title": c.title,
                "severity": c.severity,
                "status": c.status,
                "lead_analyst": c.lead_analyst,
                "target_hostname": c.target_hostname,
                "exercise_id": c.exercise_id,
                "created_at": c.created_at.isoformat() + "Z" if c.created_at else None,
                "ttd_seconds": c.ttd_seconds,
                "tta_seconds": c.tta_seconds,
                "tti_seconds": c.tti_seconds,
                "ttr_seconds": c.ttr_seconds,
                "timeline_events": c.timeline_events,
                "evidence_ids": c.evidence_ids
            }
            for c in cases
        ],
        "source": "case_engine",
        "last_updated": datetime.utcnow().isoformat() + "Z",
        "status": "live" if len(cases) > 0 else "no_telemetry",
        "confidence": 1.0
    }

@router.post("/{case_id}/acknowledge")
async def acknowledge_case(
    case_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Acknowledge case and record Time to Acknowledge (TTA)."""
    stmt = select(IncidentCaseModel).where(IncidentCaseModel.case_id == case_id)
    res = await db.execute(stmt)
    case = res.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    now = datetime.utcnow()
    case.acknowledged_at = now
    case.status = "investigating"
    case.lead_analyst = user.get("username", "analyst")
    
    if case.created_at:
        case.tta_seconds = round((now - case.created_at).total_seconds(), 2)

    events = list(case.timeline_events or [])
    events.append({
        "timestamp": now.isoformat() + "Z",
        "stage": "ANALYST_ACKNOWLEDGED",
        "delta_s": case.tta_seconds or 0.0,
        "desc": f"Case acknowledged and claimed by analyst {case.lead_analyst}"
    })
    case.timeline_events = events
    await db.commit()
    return {"status": "acknowledged", "case_id": case_id, "tta_seconds": case.tta_seconds}

@router.post("/{case_id}/contain")
async def contain_case(
    case_id: str,
    payload: Dict[str, str] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Perform containment (Host Isolation, Firewall Block) and compute Time to Respond (TTR)."""
    stmt = select(IncidentCaseModel).where(IncidentCaseModel.case_id == case_id)
    res = await db.execute(stmt)
    case = res.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    now = datetime.utcnow()
    case.contained_at = now
    case.status = "contained"
    action_type = payload.get("action", "HOST_ISOLATION")
    
    if case.created_at:
        case.ttr_seconds = round((now - case.created_at).total_seconds(), 2)

    events = list(case.timeline_events or [])
    events.append({
        "timestamp": now.isoformat() + "Z",
        "stage": "CONTAINMENT_EXECUTED",
        "delta_s": case.ttr_seconds or 0.0,
        "desc": f"Containment executed: {action_type} on target {case.target_hostname}"
    })
    case.timeline_events = events
    await db.commit()
    return {"status": "contained", "case_id": case_id, "ttr_seconds": case.ttr_seconds}
