from typing import Dict, Any, List
from sqlalchemy import select, func
from app.database import async_session_maker, ShadowEventModel, DetectionModel

class MitreCorrelator:
    """Builds live MITRE ATT&CK coverage statistics purely from evidence."""
    
    async def get_coverage_matrix(self) -> Dict[str, Any]:
        async with async_session_maker() as session:
            # Aggregate distinct techniques from ingested events
            stmt_events = (
                select(ShadowEventModel.mitre_technique, ShadowEventModel.mitre_tactic, func.count(ShadowEventModel.event_id))
                .where(ShadowEventModel.mitre_technique.isnot(None))
                .group_by(ShadowEventModel.mitre_technique, ShadowEventModel.mitre_tactic)
            )
            res_events = await session.execute(stmt_events)
            telemetry_techniques = {row[0]: {"tactic": row[1], "telemetry_count": row[2], "detected": False} for row in res_events}
            
            # Check which techniques also triggered detections
            stmt_dets = (
                select(DetectionModel.mitre_technique, func.count(DetectionModel.detection_id))
                .where(DetectionModel.mitre_technique.isnot(None))
                .group_by(DetectionModel.mitre_technique)
            )
            res_dets = await session.execute(stmt_dets)
            for row in res_dets:
                tech_id = row[0]
                if tech_id in telemetry_techniques:
                    telemetry_techniques[tech_id]["detected"] = True
                    telemetry_techniques[tech_id]["detection_count"] = row[1]
                else:
                    telemetry_techniques[tech_id] = {
                        "tactic": "unknown",
                        "telemetry_count": 0,
                        "detected": True,
                        "detection_count": row[1]
                    }

        total_tested = len(telemetry_techniques)
        detected_count = sum(1 for v in telemetry_techniques.values() if v.get("detected", False))
        coverage_pct = round((detected_count / total_tested) * 100, 1) if total_tested > 0 else 0.0

        return {
            "tested_techniques_count": total_tested,
            "detected_techniques_count": detected_count,
            "coverage_percentage": coverage_pct,
            "techniques": telemetry_techniques,
            "source": "mitre_evidence_engine"
        }

mitre_correlator = MitreCorrelator()
