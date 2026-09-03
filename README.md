# ShadowXLab Cyber Range Platform · Enterprise Edition

![ShadowXLab](https://img.shields.io/badge/ShadowXLab-SOC%20Analyst%20Track-red?style=for-the-badge)
![Labs](https://img.shields.io/badge/Interactive%20Labs-45%20Modules-emerald?style=for-the-badge)
![Hypervisor](https://img.shields.io/badge/Hypervisor-Oracle%20VirtualBox-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Platform-Production%20Ready-green?style=for-the-badge)

ShadowXLab is an enterprise-grade cybersecurity range and hands-on learning appliance featuring:
- **45 Interactive SOC Analyst Modules**: Progressive V8 networking journey, pfSense perimeter firewall labs, and full open-source tool simulators (Nmap, Wireshark, Metasploit, Nessus, Nikto, CyberChef, Snort, Suricata, Splunk, Zeek, Wazuh).
- **Oracle VirtualBox Hypervisor Engine**: Real local multi-VM lab range control (Kali Linux, pfSense, Metasploitable, Windows Workstations) with ICMP ping probes and TCP reachability tests.
- **Enterprise Control Plane**: Falcon EDR Workbench, Real-Time Response (RTR) terminal, Security Baseline auditing (CIS/ASB), and Purple Team exercises.
- **Zero-Error Universal Simulators**: Terminal engines with SVG network topology diagrams and live execution pipelines.

---

## 📦 Download Pre-Packaged Zips

You can download the full standalone platform directly from this repository:
- **[Download ShadowXLab-Shareable.zip](./ShadowXLab-Shareable.zip)** *(Slack-safe, clean web bundle, 1.2 MB)*
- **[Download Sxl-Cyberplatform.zip](./Sxl-Cyberplatform.zip)** *(Complete package with launchers)*

---

## 🚀 Quick Start (Running on Localhost)

### Method 1: Python Desktop Launcher (Zero Configuration)
```bash
python desktop_launcher.py
```
This script automatically:
1. Detects Oracle VirtualBox on your system and lists your active VMs.
2. Starts the FastAPI backend and hypervisor REST engine on port `8000`.
3. Opens your default web browser to the management dashboard (`http://localhost:3000` or `http://localhost:8000`).

---

### Method 2: Native Windows Executable
Double-click `ShadowXLab.exe` (or run `start-shadowxlab.bat`).
To recompile `ShadowXLab.exe` from source on any Windows machine:
```powershell
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:exe /out:ShadowXLab.exe ShadowXLabLauncher.cs
```

---

### Method 3: Full Development Mode (Node.js + Vite)
```bash
# 1. Install frontend dependencies and launch Vite dev server
npm install
npm run dev

# 2. In a second terminal, start the FastAPI backend
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🌐 Localhost Port Reference

| Service | Local URL | Description |
| :--- | :--- | :--- |
| **Enterprise Web Console** | `http://localhost:3000` | Full reactive control plane and lab management |
| **Unified Backend & Static Web** | `http://127.0.0.1:8000` | FastAPI REST APIs, WebSockets, and production build |
| **45 Interactive SOC Labs** | `http://localhost:3000/soc-interactive-labs.html` | Standalone lab workspace with show/collapse navigator |
| **VirtualBox Hypervisor API** | `http://127.0.0.1:8000/api/v1/virtualbox/vms` | REST endpoints for guest VM power and ping latency |

---

## 📁 Repository Structure

```
cyber-platform/
├── ShadowXLab.exe              # Standalone Windows 64-bit launcher
├── start-shadowxlab.bat        # Automated batch launcher
├── desktop_launcher.py         # Python desktop runner with browser auto-open
├── ShadowXLab-Shareable.zip    # Clean shareable zip for Slack / Teams
├── Sxl-Cyberplatform.zip       # Full platform zip package
├── dist/                       # Compiled production frontend
│   ├── index.html              # Main web console
│   └── soc-interactive-labs.html # 45 SOC Analyst interactive labs & simulators
├── backend/                    # FastAPI core, VirtualBox engine, data models
│   ├── app/infrastructure/     # VirtualBox & Proxmox hypervisor managers
│   └── app/api/                # REST endpoints (/api/v1)
└── src/                        # React source code (Control plane, EDR, Labs)
```

---

## 🛡️ License
Private and Confidential · Built for Enterprise Cyber Range Training.
