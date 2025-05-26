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
    <title>Redir Control Panel</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .section h2 {
            margin-top: 0;
            color: #555;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        button {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 10px;
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
        button.success {
            background-color: #28a745;
        }
        button.success:hover {
            background-color: #218838;
        }
        .process-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .process-table th,
        .process-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .process-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .process-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .status {
            padding: 20px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .status.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .status.info {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        .refresh-btn {
            float: right;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Redir Control Panel</h1>
        
        <div id="status"></div>
        
        <!-- 新しいredirプロセスを開始 -->
        <div class="section">
            <h2>📤 新しいRedirプロセスを開始</h2>
            <form id="startForm">
                <div class="form-group">
                    <label for="localPort">ローカルポート:</label>
                    <input type="number" id="localPort" name="localPort" required min="1" max="65535" placeholder="例: 8080">
                </div>
                <div class="form-group">
                    <label for="remoteHost">リモートホスト:</label>
                    <input type="text" id="remoteHost" name="remoteHost" required placeholder="例: 192.168.1.100">
                </div>
                <div class="form-group">
                    <label for="remotePort">リモートポート:</label>
                    <input type="number" id="remotePort" name="remotePort" required min="1" max="65535" placeholder="例: 80">
                </div>
                <div class="form-group">
                    <label for="protocol">プロトコル:</label>
                    <select id="protocol" name="protocol">
                        <option value="tcp">TCP</option>
                        <option value="udp">UDP</option>
                    </select>
                </div>
                <button type="submit" class="success">🚀 Redirを開始</button>
            </form>
        </div>
        
        <!-- 実行中のredirプロセス一覧 -->
        <div class="section">
            <h2>📊 実行中のRedirプロセス</h2>
            <button onclick="refreshProcesses()" class="refresh-btn">🔄 更新</button>
            <div id="processesContainer">
                <p>読み込み中...</p>
            </div>
        </div>
        
        <!-- ログ表示 -->
        <div class="section">
            <h2>📝 ログ</h2>
            <div id="logContainer" style="background: #f8f9fa; padding: 15px; border-radius: 4px; font-family: monospace; height: 200px; overflow-y: auto;">
                ログを表示します...
            </div>
            <button onclick="clearLog()" style="margin-top: 10px;">🗑️ ログをクリア</button>
        </div>
    </div>

    <script>
        let logEntries = [];

        function addLog(message, type = 'info') {
            const timestamp = new Date().toLocaleString();
            logEntries.push({ timestamp, message, type });
            updateLogDisplay();
        }

        function updateLogDisplay() {
            const container = document.getElementById('logContainer');
            container.innerHTML = logEntries.map(entry => 
                \`<div style="margin-bottom: 5px; color: \${entry.type === 'error' ? '#dc3545' : entry.type === 'success' ? '#28a745' : '#333'};">
                    [\${entry.timestamp}] \${entry.message}
                </div>\`
            ).join('');
            container.scrollTop = container.scrollHeight;
        }

        function clearLog() {
            logEntries = [];
            updateLogDisplay();
        }

        function showStatus(message, type) {
            const statusDiv = document.getElementById('status');
            statusDiv.innerHTML = \`<div class="status \${type}">\${message}</div>\`;
            setTimeout(() => {
                statusDiv.innerHTML = '';
            }, 5000);
        }

        async function refreshProcesses() {
            try {
                const response = await fetch('/api/processes');
                const data = await response.json();
                
                if (data.success) {
                    displayProcesses(data.processes);
                    addLog(\`プロセス一覧を更新しました (\${data.processes.length}件)\`, 'success');
                } else {
                    showStatus('プロセス一覧の取得に失敗しました: ' + data.error, 'error');
                    addLog('プロセス一覧の取得に失敗: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('エラー: ' + error.message, 'error');
                addLog('エラー: ' + error.message, 'error');
            }
        }

        function displayProcesses(processes) {
            const container = document.getElementById('processesContainer');
            
            if (processes.length === 0) {
                container.innerHTML = '<p>実行中のredirプロセスはありません。</p>';
                return;
            }

            let html = \`
                <table class="process-table">
                    <thead>
                        <tr>
                            <th>PID</th>
                            <th>ユーザー</th>
                            <th>CPU</th>
                            <th>メモリ</th>
                            <th>開始時刻</th>
                            <th>コマンド</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
            \`;

            processes.forEach(proc => {
                html += \`
                    <tr>
                        <td>\${proc.pid}</td>
                        <td>\${proc.user}</td>
                        <td>\${proc.cpu}%</td>
                        <td>\${proc.mem}%</td>
                        <td>\${proc.started}</td>
                        <td title="\${proc.command}" style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${proc.command}</td>
                        <td>
                            <button onclick="killProcess(\${proc.pid})" class="danger">🗑️ 停止</button>
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
            if (!confirm(\`PID \${pid} のプロセスを停止しますか？\`)) {
                return;
            }

            try {
                const response = await fetch('/api/kill', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ pid })
                });

                const data = await response.json();
                
                if (data.success) {
                    showStatus(\`PID \${pid} のプロセスを停止しました\`, 'success');
                    addLog(\`PID \${pid} のプロセスを停止しました\`, 'success');
                    refreshProcesses();
                } else {
                    showStatus('プロセスの停止に失敗しました: ' + data.error, 'error');
                    addLog('プロセス停止に失敗: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('エラー: ' + error.message, 'error');
                addLog('エラー: ' + error.message, 'error');
            }
        }

        document.getElementById('startForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);

            try {
                const response = await fetch('/api/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if (result.success) {
                    showStatus(\`Redirプロセスを開始しました (PID: \${result.pid})\`, 'success');
                    addLog(\`Redirプロセスを開始: \${data.localPort} -> \${data.remoteHost}:\${data.remotePort} (\${data.protocol.toUpperCase()}) PID: \${result.pid}\`, 'success');
                    e.target.reset();
                    refreshProcesses();
                } else {
                    showStatus('Redirプロセスの開始に失敗しました: ' + result.error, 'error');
                    addLog('Redirプロセス開始に失敗: ' + result.error, 'error');
                }
            } catch (error) {
                showStatus('エラー: ' + error.message, 'error');
                addLog('エラー: ' + error.message, 'error');
            }
        });

        // ページ読み込み時にプロセス一覧を取得
        window.addEventListener('load', function() {
            addLog('Redir Control Panelが開始されました', 'info');
            refreshProcesses();
        });

        // 定期的にプロセス一覧を更新
        setInterval(refreshProcesses, 10000); // 10秒ごと
    </script>
</body>
</html>
`;

// ルート
app.get('/', (req, res) => {
    res.send(htmlTemplate);
});

// API: redirプロセス一覧を取得
app.get('/api/processes', (req, res) => {
    exec('ps aux | grep redir | grep -v grep', (error, stdout, stderr) => {
        if (error) {
            return res.json({ success: false, error: error.message });
        }

        const processes = [];
        const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');

        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 11) {
                processes.push({
                    user: parts[0],
                    pid: parts[1],
                    cpu: parts[2],
                    mem: parts[3],
                    vsz: parts[4],
                    rss: parts[5],
                    tty: parts[6],
                    stat: parts[7],
                    started: parts[8],
                    time: parts[9],
                    command: parts.slice(10).join(' ')
                });
            }
        });

        res.json({ success: true, processes });
    });
});

// API: redirプロセスを開始
app.post('/api/start', (req, res) => {
    const { localPort, remoteHost, remotePort, protocol } = req.body;

    // パラメータ検証
    if (!localPort || !remoteHost || !remotePort || !protocol) {
        return res.json({ success: false, error: '必要なパラメータが不足しています' });
    }

    // redirコマンドを構築
    let command;
    if (protocol === 'tcp') {
        command = `redir --lport=${localPort} --caddr=${remoteHost} --cport=${remotePort}`;
    } else if (protocol === 'udp') {
        command = `redir --lport=${localPort} --caddr=${remoteHost} --cport=${remotePort} --udp`;
    } else {
        return res.json({ success: false, error: '無効なプロトコルです' });
    }

    // バックグラウンドでredirを実行
    const child = spawn('sh', ['-c', command + ' &'], { 
        detached: true,
        stdio: 'ignore'
    });

    child.unref();

    setTimeout(() => {
        // プロセスが正常に開始されたか確認
        exec(`ps aux | grep "redir.*${localPort}" | grep -v grep`, (error, stdout, stderr) => {
            if (error || !stdout.trim()) {
                return res.json({ success: false, error: 'redirプロセスの開始に失敗しました' });
            }

            const lines = stdout.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const parts = lastLine.trim().split(/\s+/);
            const pid = parts[1];

            res.json({ success: true, pid, command });
        });
    }, 1000);
});

// API: プロセスを停止
app.post('/api/kill', (req, res) => {
    const { pid } = req.body;

    if (!pid) {
        return res.json({ success: false, error: 'PIDが指定されていません' });
    }

    exec(`kill -9 ${pid}`, (error, stdout, stderr) => {
        if (error) {
            return res.json({ success: false, error: error.message });
        }

        res.json({ success: true, message: `PID ${pid} のプロセスを停止しました` });
    });
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`🚀 Redir Control Panel が http://localhost:${PORT} で起動しました`);
    console.log('⚠️  このアプリケーションはroot権限で実行してください');
});

module.exports = app;