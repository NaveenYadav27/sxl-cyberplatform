from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy import select
from app.database import async_session_maker, PurpleExerciseModel, ShadowEventModel, DetectionModel, IncidentCaseModel
from app.websocket.event_bus import event_bus

class PurpleEngine:
    """
    Evidence-Backed Purple Scoring & Exercise Correlator
    Formula: Telemetry (35) + Detection (30) + Investigation (20) + Response (15) = 100%
    """
    
    async def evaluate_exercise(self, exercise_id: str) -> Dict[str, Any]:
        async with async_session_maker() as session:
            stmt = select(PurpleExerciseModel).where(PurpleExerciseModel.exercise_id == exercise_id)
            res = await session.execute(stmt)
            exercise = res.scalars().first()
            if not exercise:
                return {"error": "Exercise not found", "total_score": 0.0}

            telemetry_score = 0.0
            detection_score = 0.0
            investigation_score = 0.0
            response_score = 0.0
            proof = {}
            recommendations = []

            # 1. Telemetry Verification (Max 35 pts)
            stmt_event = (
                select(ShadowEventModel)
                .where(ShadowEventModel.exercise_id == exercise_id)
                .order_by(ShadowEventModel.timestamp.desc())
            )
            res_event = await session.execute(stmt_event)
            event = res_event.scalars().first()
            if event:
                telemetry_score = 35.0
                proof["event_id"] = event.event_id
                proof["telemetry_source"] = event.source
                proof["telemetry_time"] = event.timestamp.isoformat() + "Z"
            else:
                recommendations.append("Telemetry Gap: Ensure Sysmon/Auditd agent or Zeek sensor is capturing on target subnet.")

            # 2. Detection Verification (Max 30 pts)
            stmt_det = (
                select(DetectionModel)
                .where(
                    (DetectionModel.event_id == event.event_id) if event else (DetectionModel.mitre_technique == exercise.mitre_technique)
                )
                .order_by(DetectionModel.triggered_at.desc())
            )
            res_det = await session.execute(stmt_det)
            detection = res_det.scalars().first()
            if detection:
                detection_score = 30.0
                proof["detection_id"] = detection.detection_id
                proof["rule_name"] = detection.rule_name
            else:
                recommendations.append(f"Detection Gap: Write or tune a Sigma rule for {exercise.mitre_technique} ({exercise.technique_name}).")

            # 3. Investigation Audit (Max 20 pts)
            stmt_case = (
                select(IncidentCaseModel)
                .where(IncidentCaseModel.exercise_id == exercise_id)
            )
            res_case = await session.execute(stmt_case)
            case = res_case.scalars().first()
            if case:
                proof["case_id"] = case.case_id
                if case.acknowledged_at or case.investigation_started_at:
                    investigation_score = 20.0
                    proof["investigation_validated"] = True
                else:
                    investigation_score = 10.0 # created but not acknowledged
                    recommendations.append("Investigation Lag: Alert generated case but SOC analyst has not opened investigation.")
            else:
                recommendations.append("Case Triage Gap: No incident case was automatically escalated for this detection.")

            # 4. Response Validation (Max 15 pts)
            if case and case.status in ["contained", "closed"]:
                response_score = 15.0
                proof["contained_at"] = case.contained_at.isoformat() + "Z" if case.contained_at else datetime.utcnow().isoformat() + "Z"
            elif case and case.status == "investigating":
                response_score = 5.0
                recommendations.append("Response Action Needed: Complete containment (host isolation or firewall block).")

            total_score = telemetry_score + detection_score + investigation_score + response_score

            # Update DB model
            exercise.telemetry_score = telemetry_score
            exercise.detection_score = detection_score
            exercise.investigation_score = investigation_score
            exercise.response_score = response_score
            exercise.total_purple_score = total_score
            exercise.evidence_proof = proof
            exercise.improvement_recommendations = recommendations
            exercise.completed_at = datetime.utcnow()
            exercise.status = "completed" if total_score >= 85.0 else "validated"
            
            await session.commit()

            result = {
                "exercise_id": exercise_id,
                "title": exercise.title,
                "mitre_technique": exercise.mitre_technique,
                "score_breakdown": {
                    "telemetry": {"score": telemetry_score, "max": 35.0, "proof": proof.get("event_id")},
                    "detection": {"score": detection_score, "max": 30.0, "proof": proof.get("detection_id")},
                    "investigation": {"score": investigation_score, "max": 20.0, "proof": proof.get("case_id")},
                    "response": {"score": response_score, "max": 15.0, "proof": proof.get("contained_at")}
                },
                "total_purple_score": total_score,
                "evidence_proof": proof,
                "recommendations": recommendations,
                "evaluated_at": datetime.utcnow().isoformat() + "Z"
            }

            # Broadcast updated score to WebSockets
            await event_bus.publish_purple_update(result)
            return result

purple_engine = PurpleEngine()
