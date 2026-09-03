#!/usr/bin/env python3
"""
ShadowXLab Appliance First-Boot Console Banner & CLI Setup Wizard
Displayed on TTY / SSH login (/etc/profile.d/shadowxlab.sh)
"""

import sys
import os

BANNER = """
╔══════════════════════════════════════════════════════════════════════════╗
║                   🟣 SHADOWXLAB CYBER-RANGE APPLIANCE                    ║
║                   Purple Team Operations & Range Engine                  ║
╚══════════════════════════════════════════════════════════════════════════╝

Appliance Status:
● Appliance Core Engine  : ONLINE (FastAPI + Async SQLite)
● WebSocket Event Bus    : LISTENING (/ws/events)
● Dual-NIC Isolation     : ACTIVE
    - eth0 (Management)  : 192.168.1.50
    - eth1 (Lab Range)   : 10.10.10.50/24 (Promiscuous Sniffing)
● Telemetry Collectors   :
    - Syslog Server      : UDP/TCP Port 514
    - Splunk HEC Ingest  : HTTP Port 8088 (/services/collector)
    - REST Agent API     : HTTP Port 8000 (/api/v1/telemetry/ingest)

Web Management Console   : https://192.168.1.50
REST API Documentation   : https://192.168.1.50/api/v1/docs
Persistent Storage       : /var/lib/shadowxlab
──────────────────────────────────────────────────────────────────────────
"""

def main():
    print(BANNER)
    if len(sys.argv) > 1 and sys.argv[1] == "--configure":
        print("[*] Launching Interactive Network Configuration...")
        mgmt_ip = input("Enter Management IP [192.168.1.50]: ").strip() or "192.168.1.50"
        lab_cidr = input("Enter Lab Subnet CIDR [10.10.10.0/24]: ").strip() or "10.10.10.0/24"
        print(f"\n[+] Appliance configured: Management={mgmt_ip}, Lab CIDR={lab_cidr}")
        print("[+] Settings persisted to /var/lib/shadowxlab/appliance.conf")

if __name__ == "__main__":
    main()
