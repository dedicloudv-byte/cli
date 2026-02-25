import { Hono } from 'hono';
import { handleAiChat } from './ai';
import { htmlTemplate } from './ui';

interface Env {
  VPS_BRIDGE: DurableObjectNamespace;
  R2: R2Bucket;
  AUTH_TOKEN: string;
  GEMINI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// Simple Auth Middleware
app.use('*', async (c, next) => {
  const path = c.req.path;
  // Allow installer and agent script without auth (they have their own token check in params or are public)
  if (path === '/install.sh' || path === '/agent.py') {
    return await next();
  }

  const expectedToken = c.env.AUTH_TOKEN || "your-secure-token";
  const token = c.req.query('token') || c.req.header('Authorization')?.replace('Bearer ', '');

  // For the main UI, if no token, we will let it load but it will fail API calls
  // OR we can redirect to a simple login.
  // For simplicity, we'll inject a "check auth" in the UI.

  if (path.startsWith('/api/') || path === '/browser-connect' || path === '/vps-connect') {
     if (token !== expectedToken) {
       return c.json({ error: 'Unauthorized' }, 401);
     }
  }

  await next();
});

// Main Dashboard UI
app.get('/', (c) => {
  const expectedToken = c.env.AUTH_TOKEN || "your-secure-token";
  const token = c.req.query('token');

  if (token !== expectedToken) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login Dashboard VPS AI</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
              body { font-family: 'Inter', sans-serif; }
          </style>
      </head>
      <body class="bg-gray-900 text-white flex items-center justify-center min-h-screen p-4">
          <div class="bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700">
              <div class="text-center mb-8">
                  <div class="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                  </div>
                  <h1 class="text-3xl font-bold text-white mb-2">Akses Terbatas</h1>
                  <p class="text-gray-400">Silakan masukkan token akses Anda</p>
              </div>
              <form action="/" method="GET" class="space-y-6">
                  <div>
                      <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Token Akses</label>
                      <input type="password" name="token" placeholder="••••••••••••" required class="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-600">
                  </div>
                  <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/30 active:scale-95">
                      Masuk ke Dashboard
                  </button>
              </form>
              ${token ? '<div class="mt-6 p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400 text-sm text-center font-medium animation-pulse">Token yang Anda masukkan salah!</div>' : ''}
              <div class="mt-8 pt-6 border-t border-gray-700 text-center">
                  <p class="text-gray-500 text-xs">Default: <code class="bg-gray-900 px-2 py-1 rounded text-gray-400">your-secure-token</code></p>
              </div>
          </div>
      </body>
      </html>
    `, 401);
  }

  const html = htmlTemplate.replace('{{AUTH_TOKEN}}', expectedToken);
  return c.html(html);
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
  const token = c.req.query('token') || c.env.AUTH_TOKEN || "your-secure-token";
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const wsProtocol = protocol === 'https' ? 'wss' : 'ws';

  const content = `#!/bin/bash
set -e
echo "--- VPS AI Dashboard Agent Installer ---"
export INSTALL_DIR="\$HOME/vps-ai-agent"
mkdir -p "\$INSTALL_DIR"
cd "\$INSTALL_DIR"

echo "Downloading agent.py..."
curl -sSL "${protocol}://${host}/agent.py" -o agent.py

# Try to install dependencies if on Debian/Ubuntu
if command -v apt-get &> /dev/null; then
    SUDO=""
    if [ "\$(id -u)" -ne 0 ]; then
        if command -v sudo &> /dev/null; then
            SUDO="sudo"
        fi
    fi
    echo "Checking for required system packages..."
    if ! python3 -m venv --help &> /dev/null; then
        echo "python3-venv seems to be missing. Attempting to install..."
        \$SUDO apt-get update && \$SUDO apt-get install -y python3-venv || echo "Could not install python3-venv automatically."
    fi
    if ! python3 -c "import distutils" 2>/dev/null; then
        echo "python3-distutils seems to be missing. Attempting to install..."
        \$SUDO apt-get update && \$SUDO apt-get install -y python3-distutils || echo "Could not install python3-distutils automatically."
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

if ! ./venv/bin/python3 -m pip --version &> /dev/null; then
    echo "Installing pip..."
    PY_VER=\$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    if [ "\$PY_VER" == "3.8" ]; then
        PIP_URL="https://bootstrap.pypa.io/pip/3.8/get-pip.py"
    else
        PIP_URL="https://bootstrap.pypa.io/get-pip.py"
    fi
    curl -sSL "\$PIP_URL" | ./venv/bin/python3
fi

echo "Installing dependencies..."
./venv/bin/python3 -m pip install websockets psutil

echo ""
echo "Installation complete! Starting agent..."
# Create a start script
cat > start.sh << EOF
#!/bin/bash
export INSTALL_DIR="\$INSTALL_DIR"
export DASHBOARD_URL='${wsProtocol}://${host}/vps-connect?token=${token}'
export AUTH_TOKEN='${token}'
nohup "\$INSTALL_DIR/venv/bin/python" "\$INSTALL_DIR/agent.py" > "\$INSTALL_DIR/agent.log" 2>&1 &
echo "Agent started in background. Log: \$INSTALL_DIR/agent.log"
EOF

chmod +x start.sh
./start.sh
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
  try {
    const { message, history } = await c.req.json();

    // Try to get active API key from R2
    let apiKey = c.env.GEMINI_API_KEY;
    try {
      const activeKeyIdObj = await c.env.R2.get('active_gemini_key');
      if (activeKeyIdObj) {
        const activeKeyId = await activeKeyIdObj.text();
        const fullKeyObj = await c.env.R2.get('gemini_keys/' + activeKeyId);
        if (fullKeyObj) {
          apiKey = await fullKeyObj.text();
        }
      } else {
        // Fallback to old single key if present
        const oldKey = await c.env.R2.get('gemini_api_key');
        if (oldKey) apiKey = await oldKey.text();
      }
    } catch (e) {
      console.error('Error reading from R2:', e);
    }

    if (!apiKey) {
      return c.json({
        type: 'text',
        text: 'Gemini API Key is not configured. Please set it in Settings.'
      }, 400);
    }

    const id = c.env.VPS_BRIDGE.idFromName('global');
    const obj = c.env.VPS_BRIDGE.get(id);

    return await handleAiChat(apiKey, message, history, obj);
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return c.json({
      type: 'text',
      text: 'Error communicating with AI: ' + error.message
    }, 500);
  }
});

// Settings API
app.get('/api/settings', async (c) => {
  const list = await c.env.R2.list({ prefix: 'gemini_keys/' });
  const keys = list.objects.map(obj => ({
    id: obj.key.replace('gemini_keys/', ''),
    uploaded: obj.uploaded
  }));

  const activeKeyObj = await c.env.R2.get('active_gemini_key');
  const activeKey = activeKeyObj ? await activeKeyObj.text() : null;

  return c.json({ keys, activeKey });
});

app.post('/api/settings', async (c) => {
  const { apiKey } = await c.req.json();
  if (!apiKey) return c.json({ error: 'API Key is required' }, 400);

  const keyId = apiKey.length > 8 ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4) : apiKey;

  const fullKey = 'gemini_keys/' + keyId;
  await c.env.R2.put(fullKey, apiKey);

  const activeKey = await c.env.R2.get('active_gemini_key');
  if (!activeKey) {
    await c.env.R2.put('active_gemini_key', keyId);
  }

  return c.json({ success: true, id: keyId });
});

app.post('/api/settings/select', async (c) => {
  const { id } = await c.req.json();
  await c.env.R2.put('active_gemini_key', id);
  return c.json({ success: true });
});

app.post('/api/settings/delete', async (c) => {
  const { id } = await c.req.json();
  await c.env.R2.delete('gemini_keys/' + id);

  const activeKeyObj = await c.env.R2.get('active_gemini_key');
  const activeKey = activeKeyObj ? await activeKeyObj.text() : null;
  if (activeKey === id) {
    await c.env.R2.delete('active_gemini_key');
  }

  return c.json({ success: true });
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
            this.broadcastToBrowsers({ type: 'vps_status', connected: true });
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
      this.broadcastToBrowsers({ type: 'vps_status', connected: false });
      console.log('VPS Disconnected');
    });
  }

  async handleBrowserConnection(server: WebSocket) {
    server.accept();
    this.browserSockets.add(server);

    // Send initial status
    server.send(JSON.stringify({
      type: 'vps_status',
      connected: !!(this.vpsSocket && (this.vpsSocket as any).authenticated)
    }));

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
