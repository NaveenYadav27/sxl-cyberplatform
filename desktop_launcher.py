#!/usr/bin/env python3
"""
ShadowXLab Cyber Range Appliance — Localhost Desktop Launcher
Starts the ShadowXLab Control Plane, REST APIs, VirtualBox Hypervisor Engine,
and serves the Web Console on localhost with automatic browser opening.
"""

import os
import sys
import time
import socket
import webbrowser
import subprocess
import threading

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
DIST_DIR = os.path.join(ROOT_DIR, "dist")

def print_banner():
    print("=" * 72)
    print("      SHADOWXLAB CYBER RANGE APPLIANCE · ENTERPRISE EDITION")
    print("      SOC Analyst Master Track & VirtualBox Lab Hypervisor")
    print("=" * 72)

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) == 0

def check_virtualbox():
    print("[*] Checking Oracle VirtualBox Hypervisor...")
    vbox_paths = [
        r"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe",
        r"C:\Program Files (x86)\Oracle\VirtualBox\VBoxManage.exe",
        "VBoxManage"
    ]
    vbox_bin = None
    for p in vbox_paths:
        try:
            res = subprocess.run([p, "--version"], capture_output=True, text=True, timeout=2)
            if res.returncode == 0:
                vbox_bin = p
                print(f"[+] Oracle VirtualBox Detected: {res.stdout.strip()} ({p})")
                break
        except Exception:
            continue

    if vbox_bin:
        try:
            res = subprocess.run([vbox_bin, "list", "vms"], capture_output=True, text=True, timeout=3)
            vms = [l.strip() for l in res.stdout.splitlines() if l.strip()]
            print(f"[+] Discovered {len(vms)} VirtualBox VM(s) in local range:")
            for vm in vms:
                print(f"    • {vm}")
        except Exception:
            pass
    else:
        print("[!] Oracle VirtualBox not found in default directories.")

def start_backend():
    print("\n[*] Starting ShadowXLab Core API & VirtualBox Engine on port 8000...")
    sys.path.insert(0, BACKEND_DIR)
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_level="info")

def start_frontend_vite():
    print("[*] Starting Web Console via Vite Dev Server on port 3000...")
    cmd = ["npx.cmd", "vite", "--port", "3000"] if os.name == "nt" else ["npx", "vite", "--port", "3000"]
    try:
        subprocess.run(cmd, cwd=ROOT_DIR)
    except Exception as e:
        print(f"[-] Could not launch Vite: {e}")

def main():
    print_banner()
    check_virtualbox()

    # Determine if Vite can be run (requires both Node.js and src/main.tsx)
    has_src = os.path.exists(os.path.join(ROOT_DIR, "src", "main.tsx"))
    has_node = False
    if has_src:
        try:
            res = subprocess.run(["node", "--version"], capture_output=True, text=True)
            has_node = (res.returncode == 0)
        except Exception:
            has_node = False

    # Start Backend in background thread
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()

    # Wait for backend to bind port 8000
    print("[*] Initializing database and API routes...")
    for _ in range(30):
        if is_port_in_use(8000):
            print("[+] Backend API online at http://127.0.0.1:8000")
            break
        time.sleep(0.5)

    target_url = "http://localhost:3000" if has_node else "http://localhost:8000"

    # Start Vite if Node is installed, otherwise backend serves dist/ at port 8000
    if has_node:
        vite_thread = threading.Thread(target=start_frontend_vite, daemon=True)
        vite_thread.start()
        # Wait for port 3000
        for _ in range(30):
            if is_port_in_use(3000):
                target_url = "http://localhost:3000"
                break
            time.sleep(0.5)

    print("\n" + "=" * 72)
    print(" [+] ShadowXLab Platform is Running on Localhost!")
    print(f"     • Web Console Management : {target_url}")
    print(f"     • Unified API & Labs     : http://127.0.0.1:8000")
    print(f"     • Interactive SOC Labs   : {target_url}/soc-interactive-labs.html")
    print(f"     • VirtualBox Range API   : http://127.0.0.1:8000/api/v1/virtualbox/vms")
    print("=" * 72)
    print("\n[*] Opening default web browser to platform...")
    webbrowser.open(target_url)

    print("\nPress Ctrl+C to stop ShadowXLab services.\n")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[*] Shutting down ShadowXLab Appliance services cleanly.")
        sys.exit(0)

if __name__ == "__main__":
    main()
