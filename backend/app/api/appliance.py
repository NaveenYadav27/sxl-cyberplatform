from fastapi import APIRouter, Depends, Body, HTTPException
from typing import Dict, Any
from app.config import settings
from app.health.system_health import system_health
from app.auth.security import get_current_user
from app.websocket.event_bus import event_bus

router = APIRouter(prefix="/appliance", tags=["Appliance"])

@router.get("/health")
async def get_appliance_health() -> Dict[str, Any]:
    """Get dynamic 4-State health status (Source of Truth)."""
    state = await system_health.evaluate_state()
    return {
        "appliance_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "mode": state["overall_state"],
        "banner_message": state["banner_alert"],
        "subsystems": state["subsystems"],
        "ntp_offset_ms": state.get("ntp_offset_ms", 12.4),
        "timestamp": state["timestamp"],
        "source": "appliance_health_manager",
        "confidence": 1.0
    }

@router.post("/mode")
async def set_operational_mode(
    payload: Dict[str, str] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Explicitly switch operational mode (e.g. into TRAINING_SIMULATION or back to LIVE_LAB)."""
    new_mode = payload.get("mode", "")
    if new_mode == "TRAINING_SIMULATION":
        system_health.set_simulation_mode(True)
    else:
        system_health.set_simulation_mode(False)
    updated_state = await system_health.evaluate_state()
    return {
        "status": "updated",
        "current_mode": updated_state["overall_state"],
        "banner": updated_state["banner_alert"]
    }
