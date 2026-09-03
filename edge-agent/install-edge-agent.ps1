# ==============================================================================
# ShadowXLab Edge Agent One-Step Installer (Windows / PowerShell)
# ==============================================================================
param (
    [Parameter(Mandatory=$true)]
    [string]$Token,

    [Parameter(Mandatory=$false)]
    [string]$ControlPlane = "https://sxl-cybercore.shadowxlab.com"
)

$ErrorActionPreference = "Stop"

Write-Host "[*] Setting up ShadowXLab Edge Agent on Windows..." -ForegroundColor Cyan

$InstallDir = "$env:ProgramData\ShadowXLab\EdgeAgent"
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Copy-Item -Path ".\*" -Destination $InstallDir -Recurse -Force

Set-Location $InstallDir

Write-Host "[*] Installing Python dependencies..." -ForegroundColor Cyan
python -m pip install --quiet httpx websockets aiohttp pydantic

Write-Host "[*] Pairing Edge Agent with ShadowXLab Control Plane..." -ForegroundColor Green
python agent.py --token $Token

Write-Host "[+] Edge Agent paired successfully!" -ForegroundColor Green
Write-Host "[*] To run as background daemon:" -ForegroundColor Yellow
Write-Host "    python agent.py" -ForegroundColor White
