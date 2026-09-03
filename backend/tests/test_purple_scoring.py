import uuid
import pytest
import asyncio
from datetime import datetime
from app.database import init_db, async_session_maker, PurpleExerciseModel, ShadowEventModel, DetectionModel, IncidentCaseModel
from app.engine.purple_engine import purple_engine

@pytest.mark.asyncio
async def test_evidence_backed_purple_scoring():
    await init_db()
    uid = uuid.uuid4().hex[:8]
    exercise_id = f"EX-TEST-{uid}"
    event_id = f"evt-test-{uid}"
    det_id = f"det-test-{uid}"
    case_id = f"CASE-PX-{uid}"
    
    async with async_session_maker() as session:
        ex = PurpleExerciseModel(
            exercise_id=exercise_id,
            title="Test PowerShell Exercise",
            mitre_technique="T1059.001",
            technique_name="PowerShell",
            target_hostname="WIN11-01",
            target_ip="10.10.10.21",
            status="analyzing"
        )
        session.add(ex)
        
        # Add matching telemetry event (35 pts)
        event = ShadowEventModel(
            event_id=event_id,
            source="sysmon",
            collector="hec:8088",
            hostname="WIN11-01",
            exercise_id=exercise_id,
            process="powershell.exe",
            event_type="process_creation",
            mitre_technique="T1059.001"
        )
        session.add(event)
        
        # Add matching detection (30 pts)
        det = DetectionModel(
            detection_id=det_id,
            title="Suspicious PowerShell",
            rule_name="Suspicious_PowerShell",
            event_id=event_id,
            mitre_technique="T1059.001"
        )
        session.add(det)
        
        # Add incident case with acknowledgment & containment (20 + 15 = 35 pts)
        case = IncidentCaseModel(
            case_id=case_id,
            title="Incident Case Test",
            exercise_id=exercise_id,
            status="contained",
            acknowledged_at=datetime.utcnow(),
            lead_analyst="student_analyst"
        )
        session.add(case)
        await session.commit()
        
    result = await purple_engine.evaluate_exercise(exercise_id)
    assert result["total_purple_score"] == 100.0
    assert result["score_breakdown"]["telemetry"]["score"] == 35.0
    assert result["score_breakdown"]["detection"]["score"] == 30.0
    assert result["score_breakdown"]["investigation"]["score"] == 20.0
    assert result["score_breakdown"]["response"]["score"] == 15.0
