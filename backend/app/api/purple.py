from fastapi import APIRouter, Depends, Body, HTTPException
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import select, func
from app.database import get_db, AsyncSession, async_session_maker, PurpleExerciseModel, AssetModel
from app.execution.exercise_runner import exercise_runner
from app.engine.purple_engine import purple_engine
from app.auth.security import get_current_user

router = APIRouter(prefix="/purple", tags=["Purple Team Core"])

@router.get("/score")
async def get_overall_purple_score(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Source-of-truth Purple Score calculated from evidence-backed exercise history."""
    stmt = select(func.avg(PurpleExerciseModel.total_purple_score), func.count(PurpleExerciseModel.exercise_id))
    res = await db.execute(stmt)
    avg_score, count = res.first() or (0.0, 0)
    
    val = round(avg_score, 1) if avg_score is not None else 0.0
    return {
        "metric": "Purple Team Score",
        "value": f"{val}%" if count > 0 else "N/A",
        "score_numeric": val,
        "exercises_evaluated_count": count,
        "source": "purple_evaluation_engine",
        "last_updated": datetime.utcnow().isoformat() + "Z",
        "status": "live" if count > 0 else "no_telemetry",
        "confidence": 1.0 if count > 0 else 0.0
    }

@router.get("/exercises")
async def list_exercises(db: AsyncSession = Depends(get_db)) -> List[Dict[str, Any]]:
    """List purple team exercises with evidence proofs and score breakdowns."""
    stmt = select(PurpleExerciseModel).order_by(PurpleExerciseModel.started_at.desc())
    res = await db.execute(stmt)
    exercises = res.scalars().all()
    
    return [
        {
            "exercise_id": ex.exercise_id,
            "title": ex.title,
            "mitre_technique": ex.mitre_technique,
            "technique_name": ex.technique_name,
            "target_hostname": ex.target_hostname,
            "target_ip": ex.target_ip,
            "status": ex.status,
            "total_purple_score": ex.total_purple_score,
            "score_breakdown": {
                "telemetry": ex.telemetry_score,
                "detection": ex.detection_score,
                "investigation": ex.investigation_score,
                "response": ex.response_score
            },
            "evidence_proof": ex.evidence_proof,
            "started_at": ex.started_at.isoformat() + "Z" if ex.started_at else None,
            "completed_at": ex.completed_at.isoformat() + "Z" if ex.completed_at else None
        }
        for ex in exercises
    ]

@router.post("/launch")
async def launch_purple_exercise(
    payload: Dict[str, Any] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Launch authorized Red exercise against real connected lab target."""
    target_host = payload.get("target_hostname")
    target_ip = payload.get("target_ip")

    if not target_host or not target_ip:
        async with async_session_maker() as session:
            res = await session.execute(select(AssetModel).where(AssetModel.status == "ACTIVE"))
            asset = res.scalars().first()
            if asset:
                target_host = asset.hostname
                target_ip = asset.ip_address

    return await exercise_runner.launch_exercise(
        title=payload.get("title", "PowerShell Execution Test"),
        mitre_technique=payload.get("mitre_technique", "T1059.001"),
        technique_name=payload.get("technique_name", "PowerShell"),
        target_hostname=target_host or "ShadowXLab",
        target_ip=target_ip or "100.95.175.46",
        command=payload.get("command", "powershell.exe -NoProfile -Command Get-Process"),
        protocol=payload.get("protocol", "winrm"),
        operator_user=user.get("username", "red_operator"),
        operator_role=user.get("role", "RED_OPERATOR"),
        operator_confirmed=payload.get("operator_confirmed", True)
    )

@router.post("/{exercise_id}/evaluate")
async def evaluate_purple_exercise(exercise_id: str) -> Dict[str, Any]:
    """Recalculate evidence-backed scoring for a given exercise."""
    return await purple_engine.evaluate_exercise(exercise_id)
