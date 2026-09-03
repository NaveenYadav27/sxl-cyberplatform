@echo off
title ShadowXLab Cyber-Range Appliance - Localhost Runner
cls
echo ======================================================================
echo             SHADOWXLAB PURPLE TEAM CYBER-RANGE APPLIANCE
echo      45 SOC Analyst Master Labs & VirtualBox Hypervisor Engine
echo ======================================================================

:: Check VirtualBox Installation
if exist "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" (
    echo [+] Oracle VirtualBox Detected: C:\Program Files\Oracle\VirtualBox\VBoxManage.exe
    "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" list runningvms
) else (
    echo [!] Note: VirtualBox not found in default path.
)

:: Check and install Python dependencies if missing
python -c "import uvicorn, fastapi" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Checking Python dependencies...
    echo [*] Installing required packages from backend\requirements.txt...
    pip install -r "%~dp0backend\requirements.txt"
)

echo.
echo [*] Starting ShadowXLab Backend & VirtualBox API on port 8000...
start "ShadowXLab Backend Core" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

if exist "%~dp0src\main.tsx" (
    echo [*] Starting Web Console via Vite dev server on port 3000...
    start "ShadowXLab Web Console" cmd /k "cd /d %~dp0 && npx.cmd vite --port 3000 --open"
) else (
    echo [*] Production build detected - Opening Web Console at http://localhost:8000...
    timeout /t 2 /nobreak >nul
    start "" "http://localhost:8000"
)

echo.
echo ======================================================================
echo [+] ShadowXLab Appliance is running on localhost!
echo     - Web Console Management   : http://localhost:3000
echo     - Direct Backend & Labs    : http://127.0.0.1:8000
echo     - 45 Interactive SOC Labs  : http://localhost:3000/soc-interactive-labs.html
echo     - VirtualBox Range API     : http://127.0.0.1:8000/api/v1/virtualbox/vms
echo     - Standalone Executable    : %~dp0ShadowXLab.exe
echo ======================================================================
echo.
