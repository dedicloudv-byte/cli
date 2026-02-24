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
            <div class="flex items-center space-x-4">
                <button id="settings-btn" class="text-gray-400 hover:text-white transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
                <div id="status" class="flex items-center">
                    <span class="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                    <span>Disconnected</span>
                </div>
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

    <!-- Settings Modal -->
    <div id="settings-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-gray-800 p-8 rounded-xl border border-gray-700 w-full max-w-md">
            <h2 class="text-2xl font-bold mb-4 text-blue-400">Settings</h2>
            <div class="mb-6">
                <label class="block text-gray-400 mb-2">Gemini API Key</label>
                <input type="password" id="gemini-key-input" placeholder="Enter your Gemini API Key" class="w-full bg-gray-700 border border-gray-600 rounded p-3 focus:outline-none focus:border-blue-500">
                <p id="key-status" class="mt-2 text-sm text-gray-500">Key is not set.</p>
            </div>
            <div class="flex justify-end space-x-3">
                <button id="close-settings-btn" class="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                <button id="save-settings-btn" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold transition">Save Changes</button>
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

                let data;
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    throw new Error('Invalid JSON response: ' + text.substring(0, 100));
                }

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

        // Settings Logic
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettingsBtn = document.getElementById('close-settings-btn');
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        const geminiKeyInput = document.getElementById('gemini-key-input');
        const keyStatus = document.getElementById('key-status');

        settingsBtn.onclick = async () => {
            settingsModal.classList.remove('hidden');
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.hasKey) {
                keyStatus.innerText = 'Key is already set. Enter a new one to overwrite.';
                keyStatus.className = 'mt-2 text-sm text-green-500';
            }
        };

        closeSettingsBtn.onclick = () => settingsModal.classList.add('hidden');

        saveSettingsBtn.onclick = async () => {
            const apiKey = geminiKeyInput.value.trim();
            if (!apiKey) return alert('Please enter an API key');

            try {
                const res = await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apiKey })
                });
                if (res.ok) {
                    alert('Settings saved successfully!');
                    settingsModal.classList.add('hidden');
                    geminiKeyInput.value = '';
                } else {
                    alert('Failed to save settings');
                }
            } catch (e) {
                alert('Error saving settings: ' + e.message);
            }
        };

        document.getElementById('install-command').innerText = \`curl -sSL \${window.location.protocol}//\${window.location.host}/install.sh | bash\`;

        connect();
    </script>
</body>
</html>
`;
