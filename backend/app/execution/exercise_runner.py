import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from app.database import async_session_maker, PurpleExerciseModel
from app.execution.authorization_gate import red_gate
from app.execution.winrm_executor import winrm_executor
from app.execution.ssh_executor import ssh_executor
from app.websocket.event_bus import event_bus

class ExerciseRunner:
    """Orchestrates Red Action execution, generating immutable exercise_id & action_id."""
    
    async def launch_exercise(
        self,
        title: str,
        mitre_technique: str,
        technique_name: str,
        target_hostname: str,
        target_ip: str,
        command: str,
        protocol: str = "winrm",
        operator_user: str = "red_operator",
        operator_role: str = "RED_OPERATOR",
        operator_confirmed: bool = True,
        credentials: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        # 1. Enforce 6-stage authorization gate
        red_gate.authorize_execution(operator_role, target_ip, operator_confirmed)
        
        exercise_id = f"EX-{uuid.uuid4().hex[:8].upper()}"
        action_id = f"act-{uuid.uuid4().hex[:12]}"
        
        # 2. Record exercise in database
        async with async_session_maker() as session:
            db_ex = PurpleExerciseModel(
                exercise_id=exercise_id,
                title=title,
                mitre_technique=mitre_technique,
                technique_name=technique_name,
                target_hostname=target_hostname,
                target_ip=target_ip,
                operator_user=operator_user,
                status="executing",
                red_command=command,
                execution_protocol=protocol,
                started_at=datetime.utcnow()
            )
            session.add(db_ex)
            await session.commit()
            
        # 3. Broadcast execution initiation on Event Bus
        launch_payload = {
            "exercise_id": exercise_id,
            "action_id": action_id,
            "mitre_technique": mitre_technique,
            "target_ip": target_ip,
            "target_hostname": target_hostname,
            "status": "executing",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        await event_bus.publish_purple_update(launch_payload)
        
        # 4. Dispatch execution via protocol executor
        creds = credentials or {}
        if protocol.lower() == "ssh":
            exec_result = await ssh_executor.execute_command(target_ip, command, creds)
        else:
            exec_result = await winrm_executor.execute_command(target_ip, command, creds)
            
        # 5. Update exercise record with output
        async with async_session_maker() as session:
            db_ex.red_output = exec_result.get("stdout", "")
            db_ex.status = "analyzing" # waiting for telemetry & detection evaluation
            await session.commit()

        result_payload = {
            "exercise_id": exercise_id,
            "action_id": action_id,
            "execution_result": exec_result,
            "status": "dispatched",
            "message": f"Red Action dispatched successfully to {target_hostname} ({target_ip}). Monitoring telemetry stream for correlation."
        }
        await event_bus.publish_purple_update(result_payload)
        return result_payload

exercise_runner = ExerciseRunner()
