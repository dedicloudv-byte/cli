import asyncio
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
    asyncio.run(run_agent())
