#!/usr/bin/env bash
# ==============================================================================
# ShadowXLab Edge Agent One-Step Installer (Linux / Debian / Ubuntu)
# ==============================================================================
set -e

TOKEN=""
CONTROL_PLANE="https://sxl-cybercore.shadowxlab.com"

while [[ $# -gt 0 ]]; do
  case $1 in
    --token)
      TOKEN="$2"
      shift 2
      ;;
    --control-plane)
      CONTROL_PLANE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$TOKEN" ]]; then
  echo "[-] Error: Pairing token required. Usage: ./install-edge-agent.sh --token <pairing-token>"
  exit 1
fi

echo "[*] Installing ShadowXLab Edge Agent dependencies..."
apt-get update -qq && apt-get install -y python3 python3-pip python3-venv sqlite3 curl

INSTALL_DIR="/opt/shadowxlab-edge"
mkdir -p "$INSTALL_DIR"
cp -r ./* "$INSTALL_DIR/"

cd "$INSTALL_DIR"
python3 -m venv venv
./venv/bin/pip install -q httpx websockets aiohttp pydantic

echo "[*] Pairing Edge Agent with ShadowXLab Control Plane at $CONTROL_PLANE..."
./venv/bin/python agent.py --token "$TOKEN"

# Create systemd service
cat <<EOF > /etc/systemd/system/shadowxlab-edge.service
[Unit]
Description=ShadowXLab Cyber-Range Edge Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/venv/bin/python $INSTALL_DIR/agent.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now shadowxlab-edge.service

echo "[+] ShadowXLab Edge Agent installed and active!"
echo "[+] Status: systemctl status shadowxlab-edge.service"
