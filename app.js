const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// HTMLテンプレート
const htmlTemplate = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Socat Control Panel</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f0f2f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
            font-size: 24px;
        }
        .section {
            margin-bottom: 30px;
            padding: 25px;
            border: 1px solid #e1e4e8;
            border-radius: 8px;
            background-color: #fff;
        }
        .section h2 {
            margin-top: 0;
            color: #4a5568;
            font-size: 18px;
            border-bottom: 2px solid #edf2f7;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .form-row {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: flex-end;
        }
        .form-group {
            flex: 1;
            min-width: 150px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 13px;
            color: #666;
        }
        input, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
            transition: border-color 0.2s;
        }
        input:focus, select:focus {
            border-color: #007bff;
            outline: none;
        }
        button {
            background-color: #007bff;
            color: white;
            padding: 10px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: background-color 0.2s;
        }
        button:hover {
            background-color: #0056b3;
        }
        button.danger {
            background-color: #dc3545;
        }
        button.danger:hover {
            background-color: #c82333;
        }
        
        /* テーブル関連のスタイル強化 */
        .controls-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .search-box {
            position: relative;
            width: 300px;
        }
        .search-box input {
            padding-left: 35px;
        }
        .search-box::before {
            content: '🔍';
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: #999;
        }
        
        .process-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 15px;
            border: 1px solid #e1e4e8;
            border-radius: 8px;
            overflow: hidden;
        }
        .process-table th,
        .process-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e1e4e8;
        }
        .process-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #4a5568;
            cursor: pointer;
            user-select: none;
        }
        .process-table th:hover {
            background-color: #e9ecef;
        }
        .process-table tr:last-child td {
            border-bottom: none;
        }
        .process-table tr:hover {
            background-color: #f8f9fa;
        }
        
        /* バッジスタイル */
        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-tcp { background-color: #e3f2fd; color: #1565c0; }
        .badge-udp { background-color: #fff3e0; color: #e65100; }
        .port-number { font-family: 'Consolas', monospace; font-weight: bold; color: #2c3e50; }
        
        .status {
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            display: none; /* デフォルト非表示 */
        }
        .status.show { display: block; }
        .status.success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

        .log-container {
            background: #212529;
            color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Consolas', monospace;
            height: 200px;
            overflow-y: auto;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Socat Control Panel</h1>
        
        <div id="status" class="status"></div>
        
        <div class="section">
            <h2>📤 新しい転送を開始</h2>
            <form id="startForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="localPort">ローカルポート (Listen)</label>
                        <input type="number" id="localPort" name="localPort" required min="1" max="65535" placeholder="例: 8080">
                    </div>
                    <div class="form-group" style="flex: 0 0 auto; align-self: center; padding-top: 15px;">
                        ➜
                    </div>
                    <div class="form-group">
                        <label for="remoteHost">転送先ホスト</label>
                        <input type="text" id="remoteHost" name="remoteHost" required placeholder="例: 192.168.1.100">
                    </div>
                    <div class="form-group">
                        <label for="remotePort">転送先ポート</label>
                        <input type="number" id="remotePort" name="remotePort" required min="1" max="65535" placeholder="例: 80">
                    </div>
                    <div class="form-group" style="max-width: 100px;">
                        <label for="protocol">プロトコル</label>
                        <select id="protocol" name="protocol">
                            <option value="tcp">TCP</option>
                            <option value="udp">UDP</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 0 0 auto;">
                        <button type="submit" class="success">🚀 開始</button>
                    </div>
                </div>
            </form>
        </div>
        
        <div class="section">
            <div class="controls-bar">
                <h2>📊 実行中のプロセス <span id="processCount" style="font-size: 0.8em; color: #666; font-weight: normal;">(0件)</span></h2>
                <div style="display: flex; gap: 10px;">
                    <div class="search-box">
                        <input type="text" id="searchInput" placeholder="ポート、ホスト、PIDで検索..." onkeyup="filterProcesses()">
                    </div>
                    <button onclick="refreshProcesses()" style="padding: 8px 15px;">🔄 更新</button>
                </div>
            </div>
            
            <div id="processesContainer">
                <p>読み込み中...</p>
            </div>
        </div>
        
        <div class="section">
            <h2>📝 操作ログ</h2>
            <div id="logContainer" class="log-container">
                ログを表示します...
            </div>
            <button onclick="clearLog()" style="margin-top: 10px; background-color: #6c757d;">🗑️ ログをクリア</button>
        </div>
    </div>

    <script>
        let logEntries = [];
        let currentProcesses = [];

        function addLog(message, type = 'info') {
            const timestamp = new Date().toLocaleString('ja-JP');
            logEntries.push({ timestamp, message, type });
            updateLogDisplay();
        }

        function updateLogDisplay() {
            const container = document.getElementById('logContainer');
            container.innerHTML = logEntries.map(entry => {
                let color = '#f8f9fa';
                if (entry.type === 'error') color = '#ff6b6b';
                if (entry.type === 'success') color = '#51cf66';
                return \`<div style="margin-bottom: 4px; color: \${color}; border-bottom: 1px solid #343a40; padding-bottom: 2px;">
                    <span style="opacity: 0.7;">[\${entry.timestamp}]</span> \${entry.message}
                </div>\`;
            }).join('');
            container.scrollTop = container.scrollHeight;
        }

        function clearLog() {
            logEntries = [];
            updateLogDisplay();
        }

        function showStatus(message, type) {
            const statusDiv = document.getElementById('status');
            statusDiv.className = \`status show \${type}\`;
            statusDiv.textContent = message;
            setTimeout(() => {
                statusDiv.className = 'status';
            }, 5000);
        }

        async function refreshProcesses() {
            try {
                const response = await fetch('/api/processes');
                const data = await response.json();
                
                if (data.success) {
                    currentProcesses = data.processes;
                    filterProcesses(); // フィルタと表示を更新
                    // ログへの追加は煩わしいので初回または変更時のみにするか、成功時は静かにする
                    // addLog(\`プロセス一覧更新: \${data.processes.length}件\`);
                } else {
                    showStatus('取得失敗: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('エラー: ' + error.message, 'error');
            }
        }

        function filterProcesses() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const filtered = currentProcesses.filter(proc => {
                if (!searchTerm) return true;
                // 検索対象: PID, LocalPort, RemoteHost, RemotePort, Protocol
                const searchStr = \`\${proc.pid} \${proc.details.localPort} \${proc.details.remoteHost} \${proc.details.remotePort} \${proc.details.protocol}\`.toLowerCase();
                return searchStr.includes(searchTerm);
            });
            
            document.getElementById('processCount').textContent = \`(\${filtered.length}件)\`;
            displayProcesses(filtered);
        }

        function displayProcesses(processes) {
            const container = document.getElementById('processesContainer');
            
            if (processes.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">実行中のプロセスはありません。</p>';
                return;
            }

            let html = \`
                <table class="process-table">
                    <thead>
                        <tr>
                            <th width="80">PID</th>
                            <th width="80">Proto</th>
                            <th>Local Port (In)</th>
                            <th width="30"></th>
                            <th>Remote Target (Out)</th>
                            <th>開始時刻</th>
                            <th width="100">操作</th>
                        </tr>
                    </thead>
                    <tbody>
            \`;

            // プロセスをポート番号順にソート（数値として比較）
            processes.sort((a, b) => {
                const portA = parseInt(a.details.localPort) || 0;
                const portB = parseInt(b.details.localPort) || 0;
                return portA - portB;
            });

            processes.forEach(proc => {
                const isTcp = proc.details.protocol === 'TCP';
                const badgeClass = isTcp ? 'badge-tcp' : 'badge-udp';
                
                html += \`
                    <tr>
                        <td><small style="color:#666">#</small>\${proc.pid}</td>
                        <td><span class="badge \${badgeClass}">\${proc.details.protocol || '?'}</span></td>
                        <td><span class="port-number" style="font-size: 1.2em;">\${proc.details.localPort || '-'}</span></td>
                        <td style="color: #999;">➜</td>
                        <td>
                            <div style="font-weight: bold;">\${proc.details.remoteHost || '-'}</div>
                            <div style="font-size: 0.9em; color: #666;">Port: \${proc.details.remotePort || '-'}</div>
                        </td>
                        <td style="font-size: 0.9em; color: #666;">\${proc.started}</td>
                        <td>
                            <button onclick="killProcess(\${proc.pid})" class="danger" style="padding: 6px 12px; font-size: 12px;">停止</button>
                        </td>
                    </tr>
                \`;
            });

            html += \`
                    </tbody>
                </table>
            \`;

            container.innerHTML = html;
        }

        async function killProcess(pid) {
            if (!confirm(\`PID \${pid} の転送プロセスを停止しますか？\`)) {
                return;
            }

            try {
                const response = await fetch('/api/kill', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pid })
                });

                const data = await response.json();
                
                if (data.success) {
                    showStatus(\`PID \${pid} を停止しました\`, 'success');
                    addLog(\`PID \${pid} を停止しました\`, 'success');
                    refreshProcesses();
                } else {
                    showStatus('停止失敗: ' + data.error, 'error');
                    addLog('停止失敗: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('エラー: ' + error.message, 'error');
            }
        }

        document.getElementById('startForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);

            try {
                const response = await fetch('/api/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if (result.success) {
                    showStatus(\`開始しました (PID: \${result.pid})\`, 'success');
                    addLog(\`開始: \${data.localPort} ➜ \${data.remoteHost}:\${data.remotePort} (\${data.protocol})\`, 'success');
                    e.target.reset();
                    document.getElementById('localPort').focus();
                    refreshProcesses();
                } else {
                    showStatus('開始失敗: ' + result.error, 'error');
                    addLog('開始失敗: ' + result.error, 'error');
                }
            } catch (error) {
                showStatus('エラー: ' + error.message, 'error');
            }
        });

        window.addEventListener('load', function() {
            addLog('Socat Control Panel Ready', 'info');
            refreshProcesses();
        });

        setInterval(refreshProcesses, 5000); // 5秒ごとに更新
    </script>
</body>
</html>
`;

// ルート
app.get('/', (req, res) => {
    res.send(htmlTemplate);
});

// API: socatプロセス一覧を取得（パース機能付き）
app.get('/api/processes', (req, res) => {
    // 自身のgrepを除外してsocatプロセスを取得
    const command = 'ps aux | grep socat | grep -E "LISTEN" | grep -v grep';
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            if (!stdout.trim()) {
                return res.json({ success: true, processes: [] });
            }
            // grepが終了コード1（見つからない）を返す場合も空配列を返す
            if (error.code === 1) return res.json({ success: true, processes: [] });
            return res.json({ success: false, error: error.message });
        }

        const processes = [];
        const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');

        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            // ps auxの出力形式に依存。通常は PID=1, START=8, COMMAND=10以降
            if (parts.length >= 11) {
                const pid = parts[1];
                const user = parts[0];
                const started = parts[8];
                const rawCommand = parts.slice(10).join(' ');
                
                // コマンド文字列を解析して詳細情報を抽出
                // 例: socat TCP4-LISTEN:8080,fork... TCP4:192.168.1.1:80
                let details = {
                    localPort: '?',
                    remoteHost: '?',
                    remotePort: '?',
                    protocol: '?'
                };

                try {
                    // プロトコルとローカルポートの抽出
                    const listenMatch = rawCommand.match(/(TCP|UDP)4?-LISTEN:(\d+)/i);
                    if (listenMatch) {
                        details.protocol = listenMatch[1].toUpperCase();
                        details.localPort = listenMatch[2];
                    }

                    // リモートホストとポートの抽出
                    // 後半の TCP4:IP:PORT または UDP4:IP:PORT を探す
                    // リモート部分はコマンドの後ろの方にあるため、少し緩い正規表現で
                    const remoteMatch = rawCommand.match(/(?:TCP|UDP)4?:([^:\s]+):(\d+)(?:\s|$)/i);
                    // 自身のLISTEN部分にマッチしないように注意（LISTENは除外済みだが念のため）
                    
                    if (remoteMatch) {
                        // マッチしたのがLISTENパラメータでないことを確認
                        if (!remoteMatch[0].includes('LISTEN')) {
                            details.remoteHost = remoteMatch[1];
                            details.remotePort = remoteMatch[2];
                        }
                    }
                } catch (e) {
                    console.error('Parse error:', e);
                }

                processes.push({
                    pid,
                    user,
                    started,
                    command: rawCommand,
                    details // パースした詳細情報を追加
                });
            }
        });

        res.json({ success: true, processes });
    });
});

// API: socatプロセスを開始
app.post('/api/start', (req, res) => {
    const { localPort, remoteHost, remotePort, protocol } = req.body;

    if (!localPort || !remoteHost || !remotePort || !protocol) {
        return res.json({ success: false, error: 'パラメータ不足' });
    }

    // コマンド構築
    let protocolString = '';
    if (protocol === 'tcp') {
        protocolString = `TCP4-LISTEN:${localPort},fork,reuseaddr TCP4:${remoteHost}:${remotePort}`;
    } else if (protocol === 'udp') {
        protocolString = `UDP4-LISTEN:${localPort},fork,reuseaddr UDP4:${remoteHost}:${remotePort}`;
    } else {
        return res.json({ success: false, error: '無効なプロトコル' });
    }
    
    const command = `socat ${protocolString}`;

    // バックグラウンド実行
    const child = spawn('sh', ['-c', command + ' &'], { 
        detached: true,
        stdio: 'ignore'
    });

    child.unref();

    setTimeout(() => {
        // プロセス確認
        exec(`ps aux | grep "socat.*LISTEN:${localPort}" | grep -v grep`, (error, stdout) => {
            if (error || !stdout.trim()) {
                return res.json({ success: false, error: 'プロセス開始に失敗しました' });
            }
            // 最新のPIDを取得
            const lines = stdout.trim().split('\n');
            const parts = lines[lines.length - 1].trim().split(/\s+/);
            const pid = parts[1];
            res.json({ success: true, pid });
        });
    }, 1000);
});

// API: プロセス停止
app.post('/api/kill', (req, res) => {
    const { pid } = req.body;
    if (!pid) return res.json({ success: false, error: 'PIDなし' });

    exec(`kill -9 ${pid}`, (error) => {
        if (error) return res.json({ success: false, error: error.message });
        res.json({ success: true });
    });
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`🚀 Socat Control Panel started on port ${PORT}`);
});

module.exports = app;
