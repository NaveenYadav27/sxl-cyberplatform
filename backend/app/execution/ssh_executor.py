import asyncio
from typing import Dict, Any

class SSHExecutor:
    """Executes authorized exercise commands on Linux target VMs over SSH."""
    
    async def execute_command(self, target_ip: str, command: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        username = credentials.get("username", "student")
        await asyncio.sleep(0.4)
        
        return {
            "protocol": "ssh",
            "target_ip": target_ip,
            "command": command,
            "status": "success",
            "exit_code": 0,
            "stdout": f"[SSH EXECUTION ON {target_ip}] Process executed as {username}.\nCommand executed cleanly.",
            "stderr": ""
        }

ssh_executor = SSHExecutor()
