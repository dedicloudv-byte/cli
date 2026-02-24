import { Hono } from 'hono';
import { handleAiChat } from './ai';
import { htmlTemplate } from './ui';

interface Env {
  VPS_BRIDGE: DurableObjectNamespace;
  AUTH_TOKEN: string;
  GEMINI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// Main Dashboard UI
app.get('/', (c) => {
  return c.html(htmlTemplate);
});

// Serve Agent script
app.get('/agent.py', async (c) => {
  const content = `import asyncio
import json
import os
import psutil
import websockets
import subprocess
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vps-agent")

# Configuration (These can be set via environment variables)
DASHBOARD_URL = os.environ.get("DASHBOARD_URL", "ws://localhost:8787/vps-connect")
AUTH_TOKEN = os.environ.get("AUTH_TOKEN", "your-secure-token")
CHECK_INTERVAL = 5  # seconds

async def get_metrics():
    return {
        "type": "metrics",
        "data": {
            "cpu": psutil.cpu_percent(interval=1),
            "memory": psutil.virtual_memory()._asdict(),
            "disk": psutil.disk_usage('/')._asdict(),
            "uptime": time.time() - psutil.boot_time(),
            "timestamp": time.time()
        }
    }

async def handle_command(command_data):
    cmd_type = command_data.get("command")
    path = command_data.get("path", ".")

    try:
        if cmd_type == "ls":
            files = []
            for entry in os.scandir(path):
                files.append({
                    "name": entry.name,
                    "is_dir": entry.is_dir(),
                    "size": entry.stat().st_size if not entry.is_dir() else 0,
                    "mtime": entry.stat().st_mtime
                })
            return {"status": "success", "data": files}

        elif cmd_type == "read":
            with open(path, 'r') as f:
                content = f.read()
            return {"status": "success", "data": content}

        elif cmd_type == "write":
            content = command_data.get("content", "")
            with open(path, 'w') as f:
                f.write(content)
            return {"status": "success", "message": f"File {path} written successfully"}

        elif cmd_type == "exec":
            script = command_data.get("script", "")
            result = subprocess.run(script, shell=True, capture_output=True, text=True)
            return {
                "status": "success" if result.returncode == 0 else "error",
                "stdout": result.stdout,
                "stderr": result.stderr,
                "code": result.returncode
            }
        else:
            return {"status": "error", "message": f"Unknown command: {cmd_type}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

async def run_agent():
    while True:
        try:
            logger.info(f"Connecting to {DASHBOARD_URL}...")
            async with websockets.connect(DASHBOARD_URL) as websocket:
                # Auth
                await websocket.send(json.dumps({
                    "type": "auth",
                    "token": AUTH_TOKEN
                }))

                logger.info("Connected and authenticated.")

                # Metrics sender task
                async def send_metrics_periodically():
                    while True:
                        metrics = await get_metrics()
                        await websocket.send(json.dumps(metrics))
                        await asyncio.sleep(CHECK_INTERVAL)

                metrics_task = asyncio.create_task(send_metrics_periodically())

                # Command listener
                async for message in websocket:
                    data = json.loads(message)
                    if data.get("type") == "command":
                        logger.info(f"Received command: {data.get('command')}")
                        result = await handle_command(data)
                        await websocket.send(json.dumps({
                            "type": "response",
                            "request_id": data.get("request_id"),
                            "result": result
                        }))

                metrics_task.cancel()
        except Exception as e:
            logger.error(f"Connection error: {e}. Retrying in 10 seconds...")
            await asyncio.sleep(10)

if __name__ == "__main__":
    asyncio.run(run_agent())`;
  return c.text(content);
});

// Serve Install script
app.get('/install.sh', (c) => {
  const host = c.req.header('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const wsProtocol = protocol === 'https' ? 'wss' : 'ws';

  const content = `#!/bin/bash
set -e
echo "--- VPS AI Dashboard Agent Installer ---"
INSTALL_DIR="\\$HOME/vps-ai-agent"
mkdir -p "\\$INSTALL_DIR"
cd "\\$INSTALL_DIR"

echo "Downloading agent.py..."
curl -sSL "${protocol}://${host}/agent.py" -o agent.py

echo "Setting up virtual environment..."
python3 -m venv venv || python3 -m venv venv --without-pip
source venv/bin/activate
if ! command -v pip &> /dev/null; then
    curl -sSL https://bootstrap.pypa.io/get-pip.py | python3
fi

echo "Installing dependencies..."
pip install websockets psutil

echo ""
echo "Installation complete!"
echo "To start the agent, run:"
echo "  DASHBOARD_URL='${wsProtocol}://${host}/vps-connect' AUTH_TOKEN='your-token' \\$INSTALL_DIR/venv/bin/python \\$INSTALL_DIR/agent.py"
`;
  return c.text(content);
});

// VPS Agent Connection
app.get('/vps-connect', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 426);
  }

  const id = c.env.VPS_BRIDGE.idFromName('global'); // Using a single DO for simplicity in this demo
  const obj = c.env.VPS_BRIDGE.get(id);

  return obj.fetch(c.req.raw);
});

// Browser Connection (for real-time metrics)
app.get('/browser-connect', async (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 426);
  }

  const id = c.env.VPS_BRIDGE.idFromName('global');
  const obj = c.env.VPS_BRIDGE.get(id);

  return obj.fetch(c.req.raw);
});

// AI Chat Endpoint
app.post('/api/chat', async (c) => {
  const { message, history } = await c.req.json();
  const id = c.env.VPS_BRIDGE.idFromName('global');
  const obj = c.env.VPS_BRIDGE.get(id);

  return handleAiChat(c.env.GEMINI_API_KEY, message, history, obj);
});

// Approval Endpoint
app.post('/api/approve', async (c) => {
  const { action, params } = await c.req.json();
  const id = c.env.VPS_BRIDGE.idFromName('global');
  const obj = c.env.VPS_BRIDGE.get(id);

  // Forward to DO to execute on VPS
  const response = await obj.fetch(new Request('http://do/execute', {
    method: 'POST',
    body: JSON.stringify({ action, params })
  }));

  return c.json(await response.json());
});

export default app;

// --- Durable Object ---

export class VPSBridge {
  state: DurableObjectState;
  env: Env;
  vpsSocket: WebSocket | null = null;
  browserSockets: Set<WebSocket> = new Set();
  pendingRequests: Map<string, (val: any) => void> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    // Handle API calls from Worker to DO
    if (url.pathname === '/execute') {
      const { action, params } = await request.json() as any;
      const result = await this.sendCommandToVps(action, params);
      return new Response(JSON.stringify(result));
    }

    // Handle WebSocket upgrades
    if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Not a WebSocket request', { status: 400 });
    }

    const [client, server] = new WebSocketPair();

    if (url.pathname === '/vps-connect') {
      await this.handleVpsConnection(server);
    } else if (url.pathname === '/browser-connect') {
      await this.handleBrowserConnection(server);
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async handleVpsConnection(server: WebSocket) {
    server.accept();
    this.vpsSocket = server;

    server.addEventListener('message', (msg) => {
      try {
        const data = JSON.parse(msg.data as string);

        if (data.type === 'auth') {
          // Verify token from environment variable
          const expectedToken = this.env.AUTH_TOKEN || "your-secure-token";
          if (data.token === expectedToken) {
            (server as any).authenticated = true;
            console.log('VPS Authenticated successfully');
          } else {
            console.error('VPS Auth failed: Invalid token');
            server.close(4001, 'Unauthorized');
          }
        } else if (data.type === 'metrics') {
          if (!(server as any).authenticated) return;
          // Broadcast metrics to all browsers
          this.broadcastToBrowsers(data);
        } else if (data.type === 'response') {
          // Resolve pending request
          const resolve = this.pendingRequests.get(data.request_id);
          if (resolve) {
            resolve(data.result);
            this.pendingRequests.delete(data.request_id);
          }
        }
      } catch (e) {
        console.error('Error handling VPS message', e);
      }
    });

    server.addEventListener('close', () => {
      this.vpsSocket = null;
      console.log('VPS Disconnected');
    });
  }

  async handleBrowserConnection(server: WebSocket) {
    server.accept();
    this.browserSockets.add(server);

    server.addEventListener('close', () => {
      this.browserSockets.delete(server);
    });
  }

  broadcastToBrowsers(message: any) {
    const data = JSON.stringify(message);
    for (const socket of this.browserSockets) {
      try {
        socket.send(data);
      } catch (e) {
        this.browserSockets.delete(socket);
      }
    }
  }

  async sendCommandToVps(command: string, params: any): Promise<any> {
    if (!this.vpsSocket || !(this.vpsSocket as any).authenticated) {
      return { status: 'error', message: 'VPS not connected or not authenticated' };
    }

    const requestId = crypto.randomUUID();
    const promise = new Promise((resolve) => {
      this.pendingRequests.set(requestId, resolve);
    });

    this.vpsSocket.send(JSON.stringify({
      type: 'command',
      request_id: requestId,
      command,
      ...params
    }));

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      const resolve = this.pendingRequests.get(requestId);
      if (resolve) {
        resolve({ status: 'error', message: 'Command timeout' });
        this.pendingRequests.delete(requestId);
      }
    }, 30000);

    const result = await promise;
    clearTimeout(timeout);
    return result;
  }
}
