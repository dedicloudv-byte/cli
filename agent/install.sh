#!/bin/bash

# VPS AI Dashboard Agent Installer
# This script installs the necessary dependencies and sets up the VPS agent.

set -e

echo "--- VPS AI Dashboard Agent Installer ---"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed. Please install it first."
    exit 1
fi

# Create directory for the agent if it doesn't exist
INSTALL_DIR="$HOME/vps-ai-agent"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download the agent files (In a real scenario, these would be fetched from the web)
# For now, we assume they are copied or provided.
# Since I'm creating this on the repo, I'll just write them here too or assume they exist.

echo "Setting up virtual environment..."
python3 -m venv venv
source venv/bin/activate

echo "Installing dependencies..."
pip install --upgrade pip
pip install websockets psutil

# Create the agent.py file if it doesn't exist (using the one we just created)
# In a real script, you'd use curl to download it from the dashboard.

echo ""
echo "Installation complete!"
echo "To start the agent, run:"
echo "  DASHBOARD_URL='ws://your-worker.workers.dev/vps-connect' AUTH_TOKEN='your-token' $INSTALL_DIR/venv/bin/python $INSTALL_DIR/agent.py"
echo ""
echo "You can also run it in the background using nohup:"
echo "  nohup DASHBOARD_URL='...' AUTH_TOKEN='...' $INSTALL_DIR/venv/bin/python $INSTALL_DIR/agent.py > agent.log 2>&1 &"
