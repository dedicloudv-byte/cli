export const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VPS AI Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .sidebar-transition { transition: transform 0.3s ease-in-out; }
        .sidebar-hidden { transform: translateX(-100%); }
        .sidebar-visible { transform: translateX(0); }
    </style>
</head>
<body class="bg-gray-900 text-white font-sans overflow-x-hidden">
    <div id="toast-container" class="fixed bottom-4 right-4 flex flex-col space-y-2 z-[9999]"></div>
    <div id="sidebar-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden"></div>

    <div id="sidebar" class="fixed left-0 top-0 h-full w-80 bg-gray-800 border-r border-gray-700 z-50 sidebar-transition sidebar-hidden flex flex-col">
        <div class="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 class="text-xl font-bold text-blue-400">File VPS</h2>
            <button id="close-sidebar" class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <div class="p-2 bg-gray-900 text-xs font-mono break-all" id="current-path">/</div>
        <div id="file-list" class="flex-grow overflow-y-auto p-2 space-y-1">
            <div class="text-gray-500 italic p-4 text-center">Menghubungkan...</div>
        </div>
        <div class="p-4 border-t border-gray-700">
            <button id="refresh-files" class="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold transition">Refresh</button>
        </div>
    </div>

    <div class="min-h-screen flex flex-col">
        <header class="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-30 shadow-md">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <button id="hamburger" class="text-gray-400 hover:text-white p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <h1 class="text-xl font-bold text-blue-400">AI Dashboard</h1>
                </div>
                <div class="flex items-center space-x-2">
                    <button id="settings-btn" class="text-gray-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                    <div id="status" class="flex items-center bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
                        <span id="status-indicator" class="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                        <span id="status-text" class="text-xs uppercase hidden sm:inline">Offline</span>
                    </div>
                    <button id="reconnect-btn" class="hidden bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-3 rounded uppercase">Hubungkan</button>
                </div>
            </div>
        </header>

        <main class="flex-grow container mx-auto p-4 space-y-6">
            <div id="connection-alert" class="hidden bg-red-900 border-l-4 border-red-500 p-4 rounded shadow-lg flex justify-between items-center">
                <div><p class="font-bold">VPS Terputus</p><p class="text-sm">Gagal berkomunikasi dengan agent.</p></div>
                <button id="show-install-btn" class="underline text-sm font-semibold">Lihat Script</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <h3 class="text-gray-400 text-sm">CPU</h3>
                    <div class="text-3xl font-bold" id="cpu-text">0%</div>
                    <div class="mt-2 h-1.5 bg-gray-700 rounded-full"><div id="cpu-bar" class="h-full bg-blue-500 w-0 transition-all duration-500"></div></div>
                </div>
                <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <h3 class="text-gray-400 text-sm">RAM</h3>
                    <div class="text-3xl font-bold" id="mem-text">0%</div>
                    <div class="mt-2 h-1.5 bg-gray-700 rounded-full"><div id="mem-bar" class="h-full bg-green-500 w-0 transition-all duration-500"></div></div>
                </div>
                <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <h3 class="text-gray-400 text-sm">Disk</h3>
                    <div class="text-3xl font-bold" id="disk-text">0%</div>
                    <div class="mt-2 h-1.5 bg-gray-700 rounded-full"><div id="disk-bar" class="h-full bg-purple-500 w-0 transition-all duration-500"></div></div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div class="lg:col-span-8 bg-gray-800 rounded-xl border border-gray-700 flex flex-col h-[600px] shadow-xl overflow-hidden">
                    <div class="bg-gray-700 p-4 font-bold flex justify-between items-center">
                        <span>🤖 AI Assistant</span>
                        <span class="text-xs bg-gray-600 px-2 py-1 rounded">Gemini 3 Flash</span>
                    </div>
                    <div id="chat-messages" class="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-900 bg-opacity-30 scroll-smooth">
                        <div class="bg-gray-700 p-3 rounded-lg max-w-[85%] border-l-4 border-blue-500">Halo! Ada yang bisa saya bantu?</div>
                    </div>
                    <div id="approval-box" class="hidden bg-blue-900 border-t border-blue-500 p-4">
                        <p id="approval-message" class="mb-3 text-sm font-bold">Persetujuan Diperlukan</p>
                        <div class="flex space-x-3">
                            <button id="approve-btn" class="flex-grow bg-green-600 hover:bg-green-700 py-2 rounded font-bold">Setuju</button>
                            <button id="reject-btn" class="px-6 bg-red-600 hover:bg-red-700 py-2 rounded font-bold">Tolak</button>
                        </div>
                    </div>
                    <div class="p-4 bg-gray-800 border-t border-gray-700 flex space-x-2">
                        <input type="text" id="chat-input" placeholder="Tanyakan sesuatu..." class="flex-grow bg-gray-900 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <button id="send-btn" class="bg-blue-600 hover:bg-blue-700 rounded-lg px-6 font-bold shadow-lg">Kirim</button>
                    </div>
                </div>
                <div class="lg:col-span-4 space-y-4">
                    <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
                        <h2 class="text-sm font-semibold text-gray-400 uppercase mb-3">Sistem Info</h2>
                        <div class="flex justify-between"><span>Uptime:</span><span class="font-mono text-blue-400" id="uptime-text">0s</span></div>
                    </div>
                    <div id="install-section" class="bg-gray-800 rounded-xl p-5 border border-gray-700">
                        <h2 class="text-sm font-semibold text-gray-400 uppercase mb-3">Install Agent</h2>
                        <div class="bg-black p-3 rounded-lg font-mono text-[10px] break-all border border-gray-700 text-green-400 cursor-pointer" onclick="copyInstallCmd()">
                            <code id="install-command">Loading...</code>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <div id="settings-modal" class="hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
        <div class="bg-gray-800 p-8 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
            <h2 class="text-2xl font-bold mb-6 text-blue-400">Pengaturan AI</h2>
            <div class="mb-6">
                <label class="block text-sm text-gray-400 mb-2">Gemini API Key</label>
                <input type="password" id="gemini-key-input" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="flex space-x-3">
                <button id="close-settings-btn" class="flex-grow py-3 text-gray-400">Batal</button>
                <button id="save-settings-btn" class="flex-grow bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold">Simpan</button>
            </div>
        </div>
    </div>

    <script>
        const AUTH_TOKEN = "{{AUTH_TOKEN}}";
        let ws;
        let chatHistory = [];
        let pendingAction = null;
        let isVpsConnected = false;
        let currentPath = "/";

        const elements = {
            hamburger: document.getElementById('hamburger'),
            sidebar: document.getElementById('sidebar'),
            sidebarOverlay: document.getElementById('sidebar-overlay'),
            closeSidebar: document.getElementById('close-sidebar'),
            statusIndicator: document.getElementById('status-indicator'),
            statusText: document.getElementById('status-text'),
            reconnectBtn: document.getElementById('reconnect-btn'),
            connectionAlert: document.getElementById('connection-alert'),
            chatMessages: document.getElementById('chat-messages'),
            chatInput: document.getElementById('chat-input'),
            sendBtn: document.getElementById('send-btn'),
            fileList: document.getElementById('file-list'),
            currentPath: document.getElementById('current-path'),
            refreshFiles: document.getElementById('refresh-files'),
            uptime: document.getElementById('uptime-text'),
            cpuText: document.getElementById('cpu-text'), cpuBar: document.getElementById('cpu-bar'),
            memText: document.getElementById('mem-text'), memBar: document.getElementById('mem-bar'),
            diskText: document.getElementById('disk-text'), diskBar: document.getElementById('disk-bar'),
            installCmd: document.getElementById('install-command')
        };

        function showToast(msg, type='info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            const bg = type === 'error' ? 'bg-red-600' : (type === 'success' ? 'bg-green-600' : 'bg-blue-600');
            toast.className = \`\${bg} text-white px-4 py-2 rounded-lg shadow-xl\`;
            toast.innerText = msg;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }

        function connect() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(\`\${protocol}//\${window.location.host}/browser-connect\`);
            ws.onopen = () => {
                elements.statusIndicator.className = 'w-3 h-3 rounded-full bg-green-500 mr-2';
                elements.statusText.innerText = 'Connected';
                elements.reconnectBtn.classList.add('hidden');
            };
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'metrics') {
                    if (!isVpsConnected) updateVpsStatus(true);
                    updateMetrics(data.data);
                } else if (data.type === 'vps_status') {
                    updateVpsStatus(data.connected);
                }
            };
            ws.onclose = () => {
                elements.statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500 mr-2';
                elements.statusText.innerText = 'Disconnected';
                elements.reconnectBtn.classList.remove('hidden');
                setTimeout(connect, 3000);
            };
        }

        function updateVpsStatus(connected) {
            isVpsConnected = connected;
            if (connected) {
                elements.connectionAlert.classList.add('hidden');
                fetchFiles(currentPath);
            } else {
                elements.connectionAlert.classList.remove('hidden');
            }
        }

        function updateMetrics(data) {
            elements.cpuText.innerText = Math.round(data.cpu) + '%';
            elements.cpuBar.style.width = data.cpu + '%';
            const memPercent = (data.memory.used / data.memory.total * 100).toFixed(1);
            elements.memText.innerText = memPercent + '%';
            elements.memBar.style.width = memPercent + '%';
            elements.diskText.innerText = data.disk.percent + '%';
            elements.diskBar.style.width = data.disk.percent + '%';
            const uptime = Math.floor(data.uptime);
            elements.uptime.innerText = \`\${Math.floor(uptime/3600)}j \${Math.floor((uptime%3600)/60)}m \${uptime%60}s\`;
        }

        async function fetchFiles(path) {
            if (!isVpsConnected) return;
            currentPath = path;
            elements.currentPath.innerText = path;
            try {
                const res = await fetch('/api/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'ls', params: { path } })
                });
                const result = await res.json();
                if (result.status === 'success') renderFileList(result.data);
            } catch (e) {}
        }

        function renderFileList(files) {
            elements.fileList.innerHTML = '';
            if (currentPath !== '/') {
                const div = document.createElement('div');
                div.className = 'p-2 hover:bg-gray-700 rounded cursor-pointer text-gray-400';
                div.innerText = '.. (Back)';
                div.onclick = () => fetchFiles(currentPath.substring(0, currentPath.lastIndexOf('/')) || '/');
                elements.fileList.appendChild(div);
            }
            files.forEach(file => {
                const div = document.createElement('div');
                div.className = 'p-2 hover:bg-gray-700 rounded cursor-pointer flex justify-between';
                div.innerHTML = \`<span>\${file.is_dir ? '📁' : '📄'} \${file.name}</span>\`;
                div.onclick = () => {
                    if (file.is_dir) fetchFiles(currentPath === '/' ? '/' + file.name : currentPath + '/' + file.name);
                    else sendChatWithMsg(\`Analisa file \${currentPath}/\${file.name}\`);
                };
                elements.fileList.appendChild(div);
            });
        }

        function addMessage(text, sender) {
            const div = document.createElement('div');
            div.className = sender === 'user' ? 'bg-blue-600 p-3 rounded-lg max-w-[85%] ml-auto shadow-md' : 'bg-gray-700 p-3 rounded-lg max-w-[85%] border-l-4 border-blue-500';
            div.innerText = text;
            elements.chatMessages.appendChild(div);
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

            // Save to localStorage
            const history = JSON.parse(localStorage.getItem('messages') || '[]');
            history.push({ text, sender });
            localStorage.setItem('messages', JSON.stringify(history));
        }

        async function sendChatWithMsg(message) {
            addMessage(message, 'user');
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, history: chatHistory })
                });
                const data = await res.json();
                if (data.type === 'text') {
                    addMessage(data.text, 'ai');
                    chatHistory = data.history;
                    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
                } else if (data.type === 'approval_required') {
                    pendingAction = data;
                    document.getElementById('approval-message').innerText = data.message;
                    document.getElementById('approval-box').classList.remove('hidden');
                }
            } catch (e) { addMessage('Error: ' + e.message, 'ai'); }
        }

        function toggleSidebar(show) {
            if (show) {
                elements.sidebar.classList.remove('sidebar-hidden');
                elements.sidebar.classList.add('sidebar-visible');
                elements.sidebarOverlay.classList.remove('hidden');
            } else {
                elements.sidebar.classList.remove('sidebar-visible');
                elements.sidebar.classList.add('sidebar-hidden');
                elements.sidebarOverlay.classList.add('hidden');
            }
        }

        elements.hamburger.onclick = () => toggleSidebar(true);
        elements.closeSidebar.onclick = () => toggleSidebar(false);
        elements.sidebarOverlay.onclick = () => toggleSidebar(false);
        elements.sendBtn.onclick = () => { const m = elements.chatInput.value.trim(); if (m) { elements.chatInput.value = ''; sendChatWithMsg(m); } };
        elements.chatInput.onkeypress = (e) => e.key === 'Enter' && elements.sendBtn.click();

        document.getElementById('approve-btn').onclick = async () => {
            const action = pendingAction;
            document.getElementById('approval-box').classList.add('hidden');
            const res = await fetch('/api/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: action.action === 'vps_write_file' ? 'write' : 'exec', params: action.params })
            });
            const result = await res.json();
            addMessage(result.status === 'success' ? 'Berhasil executed' : 'Error: ' + result.message, 'ai');
        };
        document.getElementById('reject-btn').onclick = () => { document.getElementById('approval-box').classList.add('hidden'); addMessage('Aksi ditolak', 'user'); };

        window.copyInstallCmd = () => { navigator.clipboard.writeText(elements.installCmd.innerText); showToast('Command disalin!', 'success'); };

        // Load History
        try {
            const msgs = JSON.parse(localStorage.getItem('messages') || '[]');
            msgs.forEach(m => {
                const div = document.createElement('div');
                div.className = m.sender === 'user' ? 'bg-blue-600 p-3 rounded-lg max-w-[85%] ml-auto shadow-md' : 'bg-gray-700 p-3 rounded-lg max-w-[85%] border-l-4 border-blue-500';
                div.innerText = m.text;
                elements.chatMessages.appendChild(div);
            });
            chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        } catch(e) {}

        elements.installCmd.innerText = \`curl -sSL \${window.location.protocol}//\${window.location.host}/install.sh?token=\${AUTH_TOKEN} | bash\`;
        connect();
    </script>
</body>
</html>
`;
