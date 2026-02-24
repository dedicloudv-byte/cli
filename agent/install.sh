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
python3 -m venv venv || python3 -m venv venv --without-pip
source venv/bin/activate

if ! command -v pip &> /dev/null; then
    echo "Installing pip..."
    curl -sSL https://bootstrap.pypa.io/get-pip.py | python3
fi

echo "Installing dependencies..."
pip install websockets psutil

echo ""
echo "Installation complete!"
echo "To start the agent, run:"
echo "  DASHBOARD_URL='wss://your-worker.workers.dev/vps-connect' AUTH_TOKEN='your-token' $INSTALL_DIR/venv/bin/python $INSTALL_DIR/agent.py"
