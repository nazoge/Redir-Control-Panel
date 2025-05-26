# Redir Control Panel

Debian/Ubuntu環境でredirコマンドを簡単に管理するためのWebGUIアプリケーションです。

## 🌟 特徴

- **WebGUI**: ブラウザからredirプロセスを管理
- **プロセス一覧**: 実行中のredirプロセスを表形式で表示
- **簡単操作**: GUIでredirの開始・停止が可能
- **リアルタイム更新**: プロセス状態を自動更新
- **ログ機能**: 操作履歴を表示
- **Root権限**: システムレベルでの制御

## 📋 必要な環境

- **OS**: Debian 9+ または Ubuntu 18.04+
- **権限**: root権限必須
- **パッケージ**: 
  - Node.js 14+
  - redir
  - npm

## 🚀 インストール・セットアップ

### 1. ファイルのダウンロード/作成

以下のファイルを同一ディレクトリに配置してください：
- `app.js` - メインアプリケーション
- `package.json` - Node.js設定
- `setup.sh` - セットアップスクリプト
- `start.sh` - 起動スクリプト

### 2. セットアップの実行

```bash
# 実行権限を付与
chmod +x setup.sh start.sh

# セットアップを実行（root権限必須）
sudo bash setup.sh
```

セットアップスクリプトが以下を自動実行します：
- Node.jsのインストール（未インストールの場合）
- redirパッケージのインストール
- npm依存関係のインストール
- systemdサービスの作成

## 🏃‍♂️ 起動方法

### 方法1: 手動起動
```bash
sudo bash start.sh
```

### 方法2: 直接起動
```bash
sudo node app.js
```

### 方法3: systemdサービスとして起動
```bash
# サービスを有効化
sudo systemctl enable redir-control

# サービス開始
sudo systemctl start redir-control

# ステータス確認
sudo systemctl status redir-control
```

## 🌐 使用方法

1. **アクセス**: ブラウザで `http://localhost:3000` にアクセス

2. **新しいredirプロセス開始**:
   - ローカルポート: リッスンするポート番号
   - リモートホスト: 転送先のIPアドレス
   - リモートポート: 転送先のポート番号
   - プロトコル: TCP または UDP
   - 「Redirを開始」ボタンをクリック

3. **プロセス管理**:
   - 実行中のredirプロセスが表形式で表示されます
   - 各プロセスの「停止」ボタンで個別に終了可能
   - 「更新」ボタンで最新状態を取得

4. **ログ確認**:
   - 下部のログエリアで操作履歴を確認
   - 「ログをクリア」でログ消去

## 🔧 API エンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/` | GET | WebGUI表示 |
| `/api/processes` | GET | redirプロセス一覧取得 |
| `/api/start` | POST | 新しいredirプロセス開始 |
| `/api/kill` | POST | プロセス停止 |

### API使用例

```bash
# プロセス一覧取得
curl http://localhost:3000/api/processes

# 新しいredir開始
curl -X POST http://localhost:3000/api/start \
  -H "Content-Type: application/json" \
  -d '{"localPort": 8080, "remoteHost": "192.168.1.100", "remotePort": 80, "protocol": "tcp"}'

# プロセス停止
curl -X POST http://localhost:3000/api/kill \
  -H "Content-Type: application/json" \
  -d '{"pid": 12345}'
```

## 🛠️ redirコマンドについて

redirは軽量なポートフォワーディングツールです：

```bash
# TCP転送の例
redir --lport=8080 --caddr=192.168.1.100 --cport=80

# UDP転送の例
redir --lport=53 --caddr=8.8.8.8 --cport=53 --udp
```

## 🔒 セキュリティ注意事項

- **Root権限必須**: このアプリケーションはroot権限で動作します
- **ローカルアクセス**: デフォルトではlocalhost:3000でのみアクセス可能
- **ファイアウォール**: 必要に応じてポート3000を開放してください
- **外部公開**: 外部からアクセスする場合は適切な認証機構を追加してください

## 🚨 トラブルシューティング

### Node.jsインストールエラー
```bash
# 手動でNode.jsをインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### redirコマンドが見つからない
```bash
sudo apt-get update
sudo apt-get install redir
```

### ポート3000が使用中
```bash
# 使用中のプロセスを確認
sudo netstat -tlnp | grep :3000

# または別のポートを使用（app.jsのPORT変数を変更）
```

### 権限エラー
```bash
# ファイル権限の確認・修正
sudo chown -R root:root /path/to/app
sudo chmod +x setup.sh start.sh
```

## 📝 ログファイル

アプリケーションのログは以下の場所で確認できます：

```bash
# systemdサービスのログ
sudo journalctl -u redir-control -f

# 手動実行時のログ
# コンソールに直接出力されます
```

## 🔄 アップデート方法

新しいバージョンへのアップデート：

```bash
# アプリケーション停止
sudo systemctl stop redir-control

# ファイルを新しいバージョンに置き換え

# 依存関係の更新
sudo npm install

# サービス再起動
sudo systemctl start redir-control
```

## 📊 使用例・シナリオ

### シナリオ1: Webサーバーのポート転送
ローカルの8080ポートへのアクセスを、別サーバーの80ポートに転送：
- ローカルポート: 8080
- リモートホスト: 192.168.1.100
- リモートポート: 80
- プロトコル: TCP

### シナリオ2: DNSサーバーの転送
ローカルの53ポート（UDP）へのDNSリクエストを外部DNSサーバーに転送：
- ローカルポート: 53
- リモートホスト: 8.8.8.8
- リモートポート: 53
- プロトコル: UDP

### シナリオ3: データベース接続の転送
ローカルの3306ポートへのMySQL接続を別サーバーに転送：
- ローカルポート: 3306
- リモートホスト: 192.168.1.200
- リモートポート: 3306
- プロトコル: TCP

## 🏗️ カスタマイズ

### ポート番号の変更
`app.js`の以下の行を編集：
```javascript
const PORT = 3000; // 任意のポート番号に変更
```

### 自動更新間隔の変更
WebGUIの自動更新間隔を変更する場合：
```javascript
setInterval(refreshProcesses, 10000); // 10秒ごと → 任意の値（ミリ秒）
```

### 外部アクセスを許可
外部からのアクセスを許可する場合（セキュリティに注意）：
```javascript
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

## 🔧 開発者向け情報

### プロジェクト構造
```
redir-control-panel/
├── app.js              # メインアプリケーション
├── package.json        # Node.js設定
├── setup.sh           # セットアップスクリプト
├── start.sh           # 起動スクリプト
└── README.md          # このファイル
```

### 技術スタック
- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript + HTML5 + CSS3
- **Process Management**: Linux ps/kill commands
- **System Integration**: systemd


## 🆘 サポート・FAQ

### Q: アプリケーションが起動しない
A: 以下を確認してください：
- root権限で実行しているか
- Node.jsがインストールされているか
- ポート3000が使用可能か
- 必要な依存関係がインストールされているか

### Q: redirプロセスが開始されない
A: 以下を確認してください：
- redirコマンドがインストールされているか
- 指定したポートが使用可能か
- ファイアウォール設定
- 権限の問題

### Q: プロセス一覧が表示されない
A: 以下を確認してください：
- psコマンドが利用可能か
- grepコマンドが利用可能か
- システムの負荷状況

### Q: 外部からアクセスできない
A: 以下を確認してください：
- サーバーのファイアウォール設定
- ネットワーク設定
- app.jsのバインドアドレス設定

## 📞 連絡先・貢献

このプロジェクトについてのご質問や改善提案がありましたら、以下の方法でご連絡ください：

- Issue報告
- プルリクエスト
- 機能提案

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

- [redir](https://github.com/troglobit/redir) - 軽量なポートフォワーディングツール
- [Express.js](https://expressjs.com/) - Webアプリケーションフレームワーク
- [Node.js](https://nodejs.org/) - JavaScript実行環境

---

**⚠️ 重要な注意事項**
このアプリケーションはroot権限で動作するため、本番環境での使用時は十分なセキュリティ対策を講じてください。不適切な使用により生じた問題について、開発者は責任を負いません。
