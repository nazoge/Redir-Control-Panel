#!/bin/bash

# Redir Control Panel 起動スクリプト

# rootユーザーチェック
if [ "$EUID" -ne 0 ]; then
    echo "❌ このアプリケーションはroot権限で実行してください"
    echo "使用方法: sudo bash start.sh"
    exit 1
fi

echo "🚀 Redir Control Panel を起動します..."
echo "📍 URL: http://localhost:3000"
echo "⏹️  停止するには Ctrl+C を押してください"
echo ""

# Node.jsアプリケーションを起動
node app.js