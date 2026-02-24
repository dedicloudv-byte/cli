#!/bin/bash
set -e
echo "--- VPS AI Dashboard Agent Installer ---"
INSTALL_DIR="$HOME/vps-ai-agent"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Downloading agent.py..."
# In a real scenario, the URL would be the dashboard URL
# curl -sSL https://your-dashboard.com/agent.py -o agent.py

echo "Setting up virtual environment..."
if ! python3 -m venv venv 2>/dev/null; then
    echo "Warning: python3 -m venv failed. Trying --without-pip..."
    if ! python3 -m venv venv --without-pip 2>/dev/null; then
        echo "Error: Failed to create venv. Please install python3-venv (e.g., 'apt install python3-venv' or 'apt install python3.8-venv')."
        exit 1
    fi
fi
source venv/bin/activate

if ! command -v pip &> /dev/null; then
    echo "Installing pip..."
    PY_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    if [ "$PY_VER" == "3.8" ]; then
        PIP_URL="https://bootstrap.pypa.io/pip/3.8/get-pip.py"
    else
        PIP_URL="https://bootstrap.pypa.io/get-pip.py"
    fi
    curl -sSL "$PIP_URL" | python3
fi

echo "Installing dependencies..."
pip install websockets psutil

echo ""
echo "Installation complete!"
echo "To start the agent, run:"
echo "  DASHBOARD_URL='wss://your-worker.workers.dev/vps-connect' AUTH_TOKEN='your-token' $INSTALL_DIR/venv/bin/python $INSTALL_DIR/agent.py"
