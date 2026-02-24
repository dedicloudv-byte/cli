export const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VPS AI Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .chat-container { height: 400px; overflow-y: auto; }
        .sidebar-transition { transition: transform 0.3s ease-in-out; }
        .sidebar-hidden { transform: translateX(-100%); }
        .sidebar-visible { transform: translateX(0); }
        #toast-container { position: fixed; bottom: 1rem; right: 1rem; z-index: 9999; }
    </style>
</head>
<body class="bg-gray-900 text-white font-sans overflow-x-hidden">
    <!-- Toast Notifications -->
    <div id="toast-container" class="flex flex-col space-y-2"></div>

    <!-- Sidebar Overlay -->
    <div id="sidebar-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden"></div>

    <!-- Sidebar (File VPS) -->
    <div id="sidebar" class="fixed left-0 top-0 h-full w-80 bg-gray-800 border-r border-gray-700 z-50 sidebar-transition sidebar-hidden flex flex-col">
        <div class="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 class="text-xl font-bold text-blue-400">File VPS</h2>
            <button id="close-sidebar" class="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class="p-2 bg-gray-900 text-xs font-mono break-all" id="current-path">/</div>
        <div id="file-list" class="flex-grow overflow-y-auto p-2 space-y-1">
            <div class="text-gray-500 italic p-4 text-center">Menghubungkan ke VPS...</div>
        </div>
        <div class="p-4 border-t border-gray-700">
            <button id="refresh-files" class="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold transition">Refresh</button>
        </div>
    </div>

    <div class="min-h-screen flex flex-col">
        <!-- Header -->
        <header class="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-30 shadow-md">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <button id="hamburger" class="text-gray-400 hover:text-white transition p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 class="text-xl md:text-2xl font-bold text-blue-400 truncate">AI Dashboard</h1>
                </div>

                <div class="flex items-center space-x-2 md:space-x-4">
                    <button id="settings-btn" class="text-gray-400 hover:text-white transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <div id="status" class="flex items-center bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
                        <span class="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                        <span class="text-xs font-medium uppercase tracking-wider hidden sm:inline">Offline</span>
                    </div>
                    <button id="reconnect-btn" class="hidden bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-3 rounded transition uppercase">Hubungkan</button>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-grow container mx-auto p-4 md:p-6 space-y-6">

            <!-- Connection Failed Alert -->
            <div id="connection-alert" class="hidden bg-red-900 border-l-4 border-red-500 p-4 rounded shadow-lg">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-bold">VPS Terputus</p>
                        <p class="text-sm">Gagal berkomunikasi dengan agent di VPS.</p>
                    </div>
                    <button id="show-install-btn" class="underline text-sm font-semibold hover:text-red-200">Lihat Script Install</button>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="bg-gray-800 p-4 rounded-xl shadow border border-gray-700">
                    <h3 class="text-gray-400 text-sm mb-1">CPU</h3>
                    <div class="text-3xl font-bold" id="cpu-text">0%</div>
                    <div class="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div id="cpu-bar" class="h-full bg-blue-500 transition-all duration-500 w-0"></div>
                    </div>
                </div>
                <div class="bg-gray-800 p-4 rounded-xl shadow border border-gray-700">
                    <h3 class="text-gray-400 text-sm mb-1">RAM</h3>
                    <div class="text-3xl font-bold" id="mem-text">0%</div>
                    <div class="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div id="mem-bar" class="h-full bg-green-500 transition-all duration-500 w-0"></div>
                    </div>
                </div>
                <div class="bg-gray-800 p-4 rounded-xl shadow border border-gray-700">
                    <h3 class="text-gray-400 text-sm mb-1">Disk</h3>
                    <div class="text-3xl font-bold" id="disk-text">0%</div>
                    <div class="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div id="disk-bar" class="h-full bg-purple-500 transition-all duration-500 w-0"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- AI Chat (Left/Top) -->
                <div class="lg:col-span-8 bg-gray-800 rounded-xl border border-gray-700 flex flex-col h-[500px] md:h-[600px] shadow-xl overflow-hidden">
                    <div class="bg-gray-700 p-4 flex justify-between items-center">
                        <h2 class="font-bold flex items-center">
                            <span class="mr-2 text-xl">🤖</span> AI Assistant
                        </h2>
                        <span class="text-xs bg-gray-600 px-2 py-1 rounded text-gray-300">Gemini 3 Flash</span>
                    </div>

                    <div id="chat-messages" class="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-900 bg-opacity-30 scroll-smooth">
                        <div class="bg-gray-700 p-3 rounded-lg max-w-[85%] border-l-4 border-blue-500 shadow-sm">
                            Halo! Saya AI Dashboard VPS. Saya bisa bantu analisa, perbaiki, dan buat file di VPS Anda. Ada yang bisa saya bantu?
                        </div>
                    </div>

                    <!-- AI Approval View -->
                    <div id="approval-box" class="hidden bg-blue-900 border-t border-blue-500 p-4 animate-pulse">
                        <p id="approval-message" class="mb-3 text-sm font-bold flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Persetujuan Diperlukan
                        </p>
                        <div class="flex space-x-3">
                            <button id="approve-btn" class="flex-grow bg-green-600 hover:bg-green-700 py-2 rounded font-bold shadow-lg transition transform active:scale-95">Setuju</button>
                            <button id="reject-btn" class="px-6 bg-red-600 hover:bg-red-700 py-2 rounded font-bold shadow-lg transition transform active:scale-95">Tolak</button>
                        </div>
                    </div>

                    <div class="p-4 bg-gray-800 border-t border-gray-700 flex space-x-2">
                        <input type="text" id="chat-input" placeholder="Tanyakan sesuatu..." class="flex-grow bg-gray-900 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500">
                        <button id="send-btn" class="bg-blue-600 hover:bg-blue-700 rounded-lg px-6 font-bold transition shadow-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Info Sidebar (Right/Bottom) -->
                <div class="lg:col-span-4 space-y-4">
                    <div class="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg">
                        <h2 class="text-sm font-semibold text-gray-400 uppercase mb-3">Sistem Info</h2>
                        <div class="flex justify-between items-center">
                            <span>Uptime:</span>
                            <span class="font-mono text-blue-400" id="uptime-text">0s</span>
                        </div>
                    </div>

                    <div id="install-section" class="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg">
                        <h2 class="text-sm font-semibold text-gray-400 uppercase mb-3">Install Agent</h2>
                        <p class="text-xs text-gray-500 mb-3 italic">Jalankan perintah ini di VPS Anda:</p>
                        <div class="bg-black p-3 rounded-lg font-mono text-[10px] break-all border border-gray-700 text-green-400 relative group">
                            <code id="install-command">curl -sSL ... | bash</code>
                            <button class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-white" onclick="copyInstallCmd()">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 012-2v-8a2 2 0 01-2-2h-8a2 2 0 01-2 2v8a2 2 0 012 2z"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Modals (Settings) -->
    <div id="settings-modal" class="hidden fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4">
        <div class="bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
            <h2 class="text-2xl font-bold mb-6 text-blue-400">Pengaturan AI</h2>
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-400 mb-2">Gemini API Key</label>
                <input type="password" id="gemini-key-input" placeholder="Masukkan API Key Anda" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                <p id="key-status" class="mt-3 text-xs text-gray-500 italic">Key belum diatur.</p>
            </div>
            <div class="flex space-x-3">
                <button id="close-settings-btn" class="flex-grow py-3 text-gray-400 hover:text-white transition font-medium">Batal</button>
                <button id="save-settings-btn" class="flex-grow bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold transition shadow-lg">Simpan</button>
            </div>
        </div>
    </div>

    <script>
        const AUTH_TOKEN = "{{AUTH_TOKEN}}";
        let ws;
        let chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        let pendingAction = null;
        let isVpsConnected = false;
        let currentPath = "/";

        // UI Element Selectors
        const elements = {
            hamburger: document.getElementById('hamburger'),
            sidebar: document.getElementById('sidebar'),
            sidebarOverlay: document.getElementById('sidebar-overlay'),
            closeSidebar: document.getElementById('close-sidebar'),
            status: document.getElementById('status'),
            statusIndicator: document.getElementById('status').querySelector('span'),
            statusText: document.getElementById('status').querySelectorAll('span')[1],
            reconnectBtn: document.getElementById('reconnect-btn'),
            connectionAlert: document.getElementById('connection-alert'),
            chatMessages: document.getElementById('chat-messages'),
            chatInput: document.getElementById('chat-input'),
            sendBtn: document.getElementById('send-btn'),
            fileList: document.getElementById('file-list'),
            currentPath: document.getElementById('current-path'),
            refreshFiles: document.getElementById('refresh-files'),
            uptime: document.getElementById('uptime-text'),
            cpuText: document.getElementById('cpu-text'),
            cpuBar: document.getElementById('cpu-bar'),
            memText: document.getElementById('mem-text'),
            memBar: document.getElementById('mem-bar'),
            diskText: document.getElementById('disk-text'),
            diskBar: document.getElementById('disk-bar'),
            installCmd: document.getElementById('install-command')
        };

        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            const bg = type === 'error' ? 'bg-red-600' : (type === 'success' ? 'bg-green-600' : 'bg-blue-600');
            toast.className = \`\${bg} text-white px-4 py-3 rounded-lg shadow-xl flex items-center space-x-3 transform transition-all duration-300 translate-y-full opacity-0\`;
            toast.innerHTML = \`
                <span class="font-medium">\${message}</span>
            \`;
            container.appendChild(toast);

            // Trigger animation
            setTimeout(() => {
                toast.classList.remove('translate-y-full', 'opacity-0');
            }, 10);

            setTimeout(() => {
                toast.classList.add('translate-y-full', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        function connect() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(\`\${protocol}//\${window.location.host}/browser-connect\`);

            ws.onopen = () => {
                elements.statusIndicator.className = 'w-3 h-3 rounded-full bg-green-500 mr-2';
                elements.statusText.innerText = 'Connected';
                elements.reconnectBtn.classList.add('hidden');
                showToast('Terhubung ke Dashboard', 'success');
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'metrics') {
                    if (!isVpsConnected) {
                        updateVpsStatus(true);
                    }
                    updateMetrics(data.data);
                } else if (data.type === 'vps_status') {
                    updateVpsStatus(data.connected);
                }
            };

            function updateVpsStatus(connected) {
                if (connected === isVpsConnected) return;
                isVpsConnected = connected;
                if (connected) {
                    elements.connectionAlert.classList.add('hidden');
                    showToast('VPS Terhubung!', 'success');
                    fetchFiles(currentPath);
                } else {
                    elements.connectionAlert.classList.remove('hidden');
                    showToast('VPS Terputus!', 'error');
                }
            }

            ws.onclose = () => {
                elements.statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500 mr-2';
                elements.statusText.innerText = 'Disconnected';
                elements.reconnectBtn.classList.remove('hidden');
                if (isVpsConnected) {
                    isVpsConnected = false;
                    elements.connectionAlert.classList.remove('hidden');
                    showToast('VPS Terputus!', 'error');
                }
                setTimeout(connect, 3000);
            };
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
            const h = Math.floor(uptime / 3600);
            const m = Math.floor((uptime % 3600) / 60);
            const s = uptime % 60;
            elements.uptime.innerText = \`\${h}j \${m}m \${s}d\`;
        }

        async function fetchFiles(path) {
            if (!isVpsConnected) return;
            elements.fileList.innerHTML = '<div class="text-gray-500 italic p-4 text-center">Loading...</div>';
            currentPath = path;
            elements.currentPath.innerText = path;

            try {
                const res = await fetch('/api/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'ls', params: { path } })
                });
                const result = await res.json();

                if (result.status === 'success') {
                    renderFileList(result.data);
                } else {
                    elements.fileList.innerHTML = \`<div class="text-red-500 p-4 text-center">\${result.message}</div>\`;
                }
            } catch (e) {
                elements.fileList.innerHTML = '<div class="text-red-500 p-4 text-center">Gagal memuat file</div>';
            }
        }

        function renderFileList(files) {
            elements.fileList.innerHTML = '';

            // Add Parent Dir
            if (currentPath !== '/') {
                const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
                const div = document.createElement('div');
                div.className = 'p-2 hover:bg-gray-700 rounded cursor-pointer flex items-center space-x-2 text-gray-400';
                div.innerHTML = \`
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                    <span class="font-medium text-sm">..</span>
                \`;
                div.onclick = () => fetchFiles(parentPath);
                elements.fileList.appendChild(div);
            }

            files.sort((a, b) => (b.is_dir - a.is_dir) || a.name.localeCompare(b.name)).forEach(file => {
                const div = document.createElement('div');
                div.className = 'p-2 hover:bg-gray-700 rounded cursor-pointer flex items-center justify-between group';

                const icon = file.is_dir
                    ? '<svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path></svg>'
                    : '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>';

                const size = file.is_dir ? '' : \`<span class="text-[10px] text-gray-500">\${(file.size/1024).toFixed(1)} KB</span>\`;

                div.innerHTML = \`
                    <div class="flex items-center space-x-2 overflow-hidden">
                        \${icon}
                        <span class="truncate text-sm">\${file.name}</span>
                    </div>
                    \${size}
                \`;

                div.onclick = () => {
                    if (file.is_dir) {
                        const newPath = currentPath === '/' ? '/' + file.name : currentPath + '/' + file.name;
                        fetchFiles(newPath);
                    } else {
                        // AI can read files
                        addMessage(\`Analisa file: \${file.name}\`, 'user');
                        sendChatWithMsg(\`Tolong analisa file \${currentPath}/\${file.name} dan jelaskan isinya.\`);
                        toggleSidebar(false);
                    }
                };
                elements.fileList.appendChild(div);
            });
        }

        function toggleSidebar(show) {
            if (show) {
                elements.sidebar.classList.remove('sidebar-hidden');
                elements.sidebar.classList.add('sidebar-visible');
                elements.sidebarOverlay.classList.remove('hidden');
                fetchFiles(currentPath);
            } else {
                elements.sidebar.classList.add('sidebar-hidden');
                elements.sidebar.classList.remove('sidebar-visible');
                elements.sidebarOverlay.classList.add('hidden');
            }
        }

        async function sendChatWithMsg(message) {
            addMessage(message, 'user');
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
                addMessage('Gagal komunikasi dengan AI: ' + e.message, 'ai');
            }
        }

        async function sendChat() {
            const message = elements.chatInput.value.trim();
            if (!message) return;
            elements.chatInput.value = '';
            await sendChatWithMsg(message);
        }

        function addMessage(text, sender, save = true) {
            const div = document.createElement('div');
            div.className = sender === 'user'
                ? 'bg-blue-600 p-3 rounded-lg max-w-[85%] ml-auto shadow-md'
                : 'bg-gray-700 p-3 rounded-lg max-w-[85%] border-l-4 border-blue-500 shadow-sm';

            // Basic markdown-like text support
            div.innerText = text;
            elements.chatMessages.appendChild(div);
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

            if (save) {
                const history = JSON.parse(localStorage.getItem('messages') || '[]');
                history.push({ text, sender });
                localStorage.setItem('messages', JSON.stringify(history));
                localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            }
        }

        function loadHistory() {
            const history = JSON.parse(localStorage.getItem('messages') || '[]');
            if (history.length > 0) {
                elements.chatMessages.innerHTML = '';
                history.forEach(m => addMessage(m.text, m.sender, false));
            }
        }

        function showApproval(data) {
            pendingAction = data;
            document.getElementById('approval-message').innerText = data.message;
            document.getElementById('approval-box').classList.remove('hidden');
        }

        async function handleApproval(approved) {
            document.getElementById('approval-box').classList.add('hidden');
            if (!approved) {
                addMessage('Aksi ditolak oleh user.', 'user');
                pendingAction = null;
                return;
            }

            addMessage('Aksi disetujui: ' + pendingAction.action, 'user');

            try {
                const response = await fetch('/api/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: pendingAction.action === 'vps_write_file' ? 'write' : 'exec', params: pendingAction.params })
                });
                const result = await response.json();

                if (result.status === 'success') {
                    addMessage('Berhasil: ' + (result.message || 'Selesai'), 'ai');
                    fetchFiles(currentPath); // Refresh if file was modified
                } else {
                    addMessage('Error: ' + result.message, 'ai');
                }
            } catch (e) {
                addMessage('Error eksekusi: ' + e.message, 'ai');
            }
            pendingAction = null;
        }

        // Event Listeners
        elements.hamburger.onclick = () => toggleSidebar(true);
        elements.closeSidebar.onclick = () => toggleSidebar(false);
        elements.sidebarOverlay.onclick = () => toggleSidebar(false);
        elements.refreshFiles.onclick = () => fetchFiles(currentPath);
        elements.sendBtn.onclick = sendChat;
        elements.chatInput.onkeypress = (e) => e.key === 'Enter' && sendChat();
        document.getElementById('approve-btn').onclick = () => handleApproval(true);
        document.getElementById('reject-btn').onclick = () => handleApproval(false);
        elements.reconnectBtn.onclick = () => {
            showToast('Menghubungkan kembali...', 'info');
            ws.close();
            connect();
        };
        document.getElementById('show-install-btn').onclick = () => {
            document.getElementById('install-section').scrollIntoView({ behavior: 'smooth' });
            document.getElementById('install-section').classList.add('ring-2', 'ring-blue-500');
            setTimeout(() => document.getElementById('install-section').classList.remove('ring-2', 'ring-blue-500'), 2000);
        };

        // Settings Modal
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const saveSettingsBtn = document.getElementById('save-settings-btn');
        const geminiKeyInput = document.getElementById('gemini-key-input');

        settingsBtn.onclick = async () => {
            settingsModal.classList.remove('hidden');
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.hasKey) {
                document.getElementById('key-status').innerText = 'Key sudah terpasang. Masukkan yang baru untuk merubah.';
                document.getElementById('key-status').className = 'mt-3 text-xs text-green-500 italic';
            }
        };

        document.getElementById('close-settings-btn').onclick = () => settingsModal.classList.add('hidden');
        saveSettingsBtn.onclick = async () => {
            const apiKey = geminiKeyInput.value.trim();
            if (!apiKey) return alert('Masukkan API key');
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey })
            });
            if (res.ok) {
                showToast('Pengaturan disimpan', 'success');
                settingsModal.classList.add('hidden');
                geminiKeyInput.value = '';
            }
        };

        window.copyInstallCmd = () => {
            const cmd = elements.installCmd.innerText;
            navigator.clipboard.writeText(cmd).then(() => showToast('Command disalin!', 'success'));
        };

        elements.installCmd.innerText = \`curl -sSL \${window.location.protocol}//\${window.location.host}/install.sh?token=\${AUTH_TOKEN} | bash\`;

        loadHistory();
        connect();
    </script>
</body>
</html>
`;
