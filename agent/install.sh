#!/bin/bash
set -e
echo "--- VPS AI Dashboard Agent Installer ---"
export INSTALL_DIR="$HOME/vps-ai-agent"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "Downloading agent.py..."
# curl -sSL https://your-dashboard.com/agent.py -o agent.py

# Try to install dependencies if on Debian/Ubuntu
if command -v apt-get &> /dev/null; then
    SUDO=""
    if [ "$(id -u)" -ne 0 ]; then
        if command -v sudo &> /dev/null; then
            SUDO="sudo"
        fi
    fi
    echo "Checking for required system packages..."
    if ! python3 -m venv --help &> /dev/null; then
        echo "python3-venv seems to be missing. Attempting to install..."
        $SUDO apt-get update && $SUDO apt-get install -y python3-venv || echo "Could not install python3-venv automatically."
    fi
    if ! python3 -c "import distutils" 2>/dev/null; then
        echo "python3-distutils seems to be missing. Attempting to install..."
        $SUDO apt-get update && $SUDO apt-get install -y python3-distutils || echo "Could not install python3-distutils automatically."
    fi
fi

echo "Setting up virtual environment..."
if ! python3 -m venv venv 2>/dev/null; then
    echo "Warning: python3 -m venv failed. Trying --without-pip..."
    if ! python3 -m venv venv --without-pip 2>/dev/null; then
        echo "Error: Failed to create venv. Please install python3-venv (e.g., 'apt install python3-venv')."
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
