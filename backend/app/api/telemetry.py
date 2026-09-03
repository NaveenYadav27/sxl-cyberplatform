from fastapi import APIRouter, Depends, Query, Body
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import select, func
from app.database import get_db, AsyncSession, ShadowEventModel
from app.collectors.agent_ingest import agent_ingest

router = APIRouter(prefix="/telemetry", tags=["Telemetry & Events"])

@router.post("/ingest")
async def ingest_telemetry_event(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """Universal Telemetry Ingestion Receiver (Writes to DB, triggers Sigma rules & WebSockets)."""
    return await agent_ingest.process_raw_telemetry(payload)

@router.get("/events")
async def get_events(
    limit: int = Query(default=50, le=200),
    source: Optional[str] = None,
    hostname: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieve normalized 29-field events from persistent storage."""
    query = select(ShadowEventModel).order_by(ShadowEventModel.timestamp.desc()).limit(limit)
    if source:
        query = query.where(ShadowEventModel.source == source)
    if hostname:
        query = query.where(ShadowEventModel.hostname == hostname)
        
    res = await db.execute(query)
    events = res.scalars().all()

    return {
        "count": len(events),
        "events": [
            {
                "event_id": e.event_id,
                "timestamp": e.timestamp.isoformat() + "Z" if e.timestamp else None,
                "source": e.source,
                "collector": e.collector,
                "hostname": e.hostname,
                "ip": e.ip,
                "user": e.user,
                "process": e.process,
                "parent_process": e.parent_process,
                "command_line": e.command_line,
                "event_type": e.event_type,
                "severity": e.severity,
                "risk_score": e.risk_score,
                "mitre_tactic": e.mitre_tactic,
                "mitre_technique": e.mitre_technique,
                "exercise_id": e.exercise_id,
                "action_id": e.action_id
            }
            for e in events
        ],
        "source": "event_store",
        "last_updated": datetime.utcnow().isoformat() + "Z"
    }

@router.get("/stats")
async def get_telemetry_stats(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Source-of-truth event metrics."""
    stmt_total = select(func.count(ShadowEventModel.event_id))
    res_total = await db.execute(stmt_total)
    total_events = res_total.scalar() or 0

    return {
        "metric": "Total Events Ingested",
        "value": total_events,
        "source": "event_store",
        "last_updated": datetime.utcnow().isoformat() + "Z",
        "freshness": "live",
        "status": "live" if total_events > 0 else "no_telemetry",
        "confidence": 1.0
    }
