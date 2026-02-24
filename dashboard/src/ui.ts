export const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VPS AI Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .chat-container { height: 400px; overflow-y: auto; }
    </style>
</head>
<body class="bg-gray-900 text-white font-sans">
    <div class="container mx-auto p-4">
        <header class="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
            <h1 class="text-3xl font-bold text-blue-400">VPS AI Dashboard</h1>
            <div id="status" class="flex items-center">
                <span class="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <span>Disconnected</span>
            </div>
        </header>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                <h3 class="text-gray-400 mb-2">CPU Usage</h3>
                <div class="text-4xl font-bold" id="cpu-text">0%</div>
                <div class="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div id="cpu-bar" class="h-full bg-blue-500 transition-all duration-500" style="width: 0%"></div>
                </div>
            </div>
            <div class="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                <h3 class="text-gray-400 mb-2">Memory</h3>
                <div class="text-4xl font-bold" id="mem-text">0%</div>
                <div class="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div id="mem-bar" class="h-full bg-green-500 transition-all duration-500" style="width: 0%"></div>
                </div>
            </div>
            <div class="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                <h3 class="text-gray-400 mb-2">Disk</h3>
                <div class="text-4xl font-bold" id="disk-text">0%</div>
                <div class="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div id="disk-bar" class="h-full bg-purple-500 transition-all duration-500" style="width: 0%"></div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- AI Chat -->
            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col h-[600px]">
                <h2 class="text-xl font-semibold mb-4 flex items-center">
                    <span class="mr-2">🤖</span> AI Assistant (Gemini 3 Flash)
                </h2>
                <div id="chat-messages" class="flex-grow overflow-y-auto mb-4 space-y-4 p-2">
                    <div class="bg-gray-700 p-3 rounded-lg max-w-[80%]">
                        Hello! I am your VPS AI Assistant. I can help you analyze, repair, and manage your VPS. What would you like to do?
                    </div>
                </div>
                <div id="approval-box" class="hidden bg-blue-900 border border-blue-500 p-4 rounded-lg mb-4">
                    <p id="approval-message" class="mb-3 text-sm font-medium"></p>
                    <div class="flex space-x-2">
                        <button id="approve-btn" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm transition">Approve</button>
                        <button id="reject-btn" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition">Reject</button>
                    </div>
                </div>
                <div class="flex">
                    <input type="text" id="chat-input" placeholder="Type a message or command..." class="flex-grow bg-gray-700 border border-gray-600 rounded-l-lg p-3 focus:outline-none focus:border-blue-500">
                    <button id="send-btn" class="bg-blue-600 hover:bg-blue-700 rounded-r-lg px-6 font-bold transition">Send</button>
                </div>
            </div>

            <!-- Detailed Metrics & Logs -->
            <div class="space-y-6">
                <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h2 class="text-xl font-semibold mb-4">Uptime</h2>
                    <div class="text-2xl" id="uptime-text">0s</div>
                </div>
                <div class="bg-gray-800 rounded-xl p-6 border border-gray-700 flex-grow">
                    <h2 class="text-xl font-semibold mb-4">Installation Script</h2>
                    <p class="text-gray-400 text-sm mb-4">Run this on your VPS to connect:</p>
                    <div class="bg-black p-4 rounded font-mono text-xs overflow-x-auto text-green-400" id="install-command">
                        curl -sSL https://.../install.sh | bash
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let ws;
        let chatHistory = [];
        let pendingAction = null;

        function connect() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(\`\${protocol}//\${window.location.host}/browser-connect\`);

            ws.onopen = () => {
                document.getElementById('status').children[0].className = 'w-3 h-3 rounded-full bg-green-500 mr-2';
                document.getElementById('status').children[1].innerText = 'Connected';
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'metrics') {
                    updateMetrics(data.data);
                }
            };

            ws.onclose = () => {
                document.getElementById('status').children[0].className = 'w-3 h-3 rounded-full bg-red-500 mr-2';
                document.getElementById('status').children[1].innerText = 'Disconnected';
                setTimeout(connect, 3000);
            };
        }

        function updateMetrics(data) {
            document.getElementById('cpu-text').innerText = Math.round(data.cpu) + '%';
            document.getElementById('cpu-bar').style.width = data.cpu + '%';

            const memPercent = (data.memory.used / data.memory.total * 100).toFixed(1);
            document.getElementById('mem-text').innerText = memPercent + '%';
            document.getElementById('mem-bar').style.width = memPercent + '%';

            document.getElementById('disk-text').innerText = data.disk.percent + '%';
            document.getElementById('disk-bar').style.width = data.disk.percent + '%';

            const uptime = Math.floor(data.uptime);
            const h = Math.floor(uptime / 3600);
            const m = Math.floor((uptime % 3600) / 60);
            const s = uptime % 60;
            document.getElementById('uptime-text').innerText = \`\${h}h \${m}m \${s}s\`;
        }

        async function sendChat() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            if (!message) return;

            addMessage(message, 'user');
            input.value = '';

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, history: chatHistory })
                });
                const data = await response.json();

                if (data.type === 'text') {
                    addMessage(data.text, 'ai');
                    chatHistory = data.history;
                } else if (data.type === 'approval_required') {
                    showApproval(data);
                }
            } catch (e) {
                addMessage('Error communicating with AI: ' + e.message, 'ai');
            }
        }

        function addMessage(text, sender) {
            const container = document.getElementById('chat-messages');
            const div = document.createElement('div');
            div.className = sender === 'user'
                ? 'bg-blue-600 p-3 rounded-lg max-w-[80%] ml-auto'
                : 'bg-gray-700 p-3 rounded-lg max-w-[80%]';
            div.innerText = text;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }

        function showApproval(data) {
            pendingAction = data;
            document.getElementById('approval-message').innerText = data.message;
            document.getElementById('approval-box').classList.remove('hidden');
        }

        async function handleApproval(approved) {
            document.getElementById('approval-box').classList.add('hidden');
            if (!approved) {
                addMessage('Action rejected by user.', 'user');
                pendingAction = null;
                return;
            }

            addMessage('User approved action: ' + pendingAction.action, 'user');

            try {
                const response = await fetch('/api/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: pendingAction.action === 'vps_write_file' ? 'write' : 'exec', params: pendingAction.params })
                });
                const result = await response.json();

                if (result.status === 'success') {
                    addMessage('Successfully executed: ' + (result.message || 'Action completed'), 'ai');
                } else {
                    addMessage('Error: ' + result.message, 'ai');
                }
            } catch (e) {
                addMessage('Error executing action: ' + e.message, 'ai');
            }

            pendingAction = null;
        }

        document.getElementById('send-btn').onclick = sendChat;
        document.getElementById('chat-input').onkeypress = (e) => e.key === 'Enter' && sendChat();
        document.getElementById('approve-btn').onclick = () => handleApproval(true);
        document.getElementById('reject-btn').onclick = () => handleApproval(false);

        document.getElementById('install-command').innerText = \`curl -sSL \${window.location.protocol}//\${window.location.host}/install.sh | bash\`;

        connect();
    </script>
</body>
</html>
`;
