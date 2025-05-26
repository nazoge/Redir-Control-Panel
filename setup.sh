#!/bin/bash

# Redir Control Panel セットアップスクリプト
echo "🔧 Redir Control Panel セットアップを開始します..."

# rootユーザーチェック
if [ "$EUID" -ne 0 ]; then
    echo "❌ このスクリプトはroot権限で実行してください"
    echo "使用方法: sudo bash setup.sh"
    exit 1
fi

# パッケージの更新
echo "📦 パッケージリストを更新中..."
apt update

# 必要なパッケージのインストール
echo "📥 必要なパッケージをインストール中..."

# Node.jsがインストールされているかチェック
if ! command -v node &> /dev/null; then
    echo "Node.jsをインストール中..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo "✅ Node.js は既にインストールされています ($(node --version))"
fi

# redirがインストールされているかチェック
if ! command -v redir &> /dev/null; then
    echo "redirをインストール中..."
    apt-get install -y redir
else
    echo "✅ redir は既にインストールされています"
fi

# npmパッケージのインストール
echo "📦 npm パッケージをインストール中..."
npm install

# アプリケーションディレクトリの権限設定
echo "🔒 権限を設定中..."
chown -R root:root .
chmod +x setup.sh
chmod +x start.sh

# systemd サービスファイルの作成
echo "⚙️  systemd サービスを作成中..."
cat > /etc/systemd/system/redir-control.service << EOF
[Unit]
Description=Redir Control Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# systemd の設定を再読み込み
systemctl daemon-reload

echo ""
echo "✅ セットアップが完了しました！"
echo ""
echo "🚀 アプリケーションの起動方法:"
echo "  手動起動: sudo bash start.sh"
echo "  または: sudo node app.js"
echo ""
echo "🔧 サービスとして起動する場合:"
echo "  sudo systemctl enable redir-control"
echo "  sudo systemctl start redir-control"
echo "  sudo systemctl status redir-control"
echo ""
echo "🌐 アクセス URL: http://localhost:3000"
echo "⚠️  必ずroot権限で実行してください"
echo ""