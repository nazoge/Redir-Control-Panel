# Socat Control Panel

Debian/Ubuntu環境で `socat` コマンドを使用したポートフォワーディングを簡単に管理するためのWeb GUIアプリケーションです。

コマンドラインで複雑な `socat` コマンドを打つ必要がなく、ブラウザ上から直感的にTCP/UDPの転送設定やプロセスの管理が行えます。

## 🌟 特徴

* **Web GUI**: ブラウザからポート転送の追加・削除が可能
* **Socat制御**: 高機能な `socat` コマンドをバックエンドに使用
* **可視化**: 実行中の転送プロセス（PID、ポート、転送先）を表形式で一覧表示
* **TCP/UDP対応**: TCPだけでなくUDPの転送もサポート
* **簡単操作**: フォームに入力するだけで転送を開始、ボタン一つで停止
* **ログ機能**: 操作履歴やステータスを画面内で確認可能

## 📋 動作要件

* **OS**: Linux (Debian / Ubuntu 推奨)
* **権限**: `root` 権限必須（ポートのリッスンやプロセス管理のため）
* **依存パッケージ**:
    * Node.js (v14以上推奨)
    * socat
    * npm

## 🚀 インストール・セットアップ

### 1. 準備
以下のファイルがディレクトリに含まれていることを確認してください：
* `app.js` - メインアプリケーション
* `package.json` - Node.js設定
* `setup.sh` - セットアップスクリプト
* `start.sh` - 起動スクリプト

### 2. セットアップの実行
付属のセットアップスクリプトを使用すると、必要なパッケージ（Node.js, socat）のインストールと初期設定を自動で行えます。

```bash
# 実行権限を付与
chmod +x setup.sh start.sh

# セットアップを実行（root権限必須）
sudo bash setup.sh
```

このスクリプトは以下を自動的に実行します：
* `socat` および `Node.js` のインストール確認と自動インストール
* `npm install` の実行
* systemdサービスファイル（`/etc/systemd/system/socat-control.service`）の作成と登録

## 🏃‍♂️ 起動方法

### 手動で起動する場合
```bash
sudo bash start.sh
# または
sudo node app.js
```

### サービスとしてバックグラウンド起動する場合
```bash
# サービスの有効化と開始
sudo systemctl enable socat-control
sudo systemctl start socat-control

# ステータスの確認
sudo systemctl status socat-control
```

## 🌐 使用方法

1.  **アクセス**: ブラウザで `http://localhost:3000` にアクセスします。（サーバーのIPアドレスに読み替えてください）
2.  **転送の開始**:
    * **ローカルポート**: 待ち受ける（Listen）ポート番号を入力
    * **転送先ホスト**: 転送先のIPアドレスを入力
    * **転送先ポート**: 転送先のポート番号を入力
    * **プロトコル**: TCP または UDP を選択
    * 「🚀 開始」ボタンをクリック
3.  **プロセスの管理**:
    * 画面下のリストに実行中の転送設定が表示されます。
    * 「停止」ボタンを押すと、その転送プロセス（PID）を終了します。

## 🔧 仕様詳細

本アプリケーションは、入力された設定に基づき、内部で以下のコマンドを発行しています。

**TCP転送の場合:**
```bash
socat TCP4-LISTEN:<LocalPort>,fork,reuseaddr TCP4:<RemoteHost>:<RemotePort>
```

**UDP転送の場合:**
```bash
socat UDP4-LISTEN:<LocalPort>,fork,reuseaddr UDP4:<RemoteHost>:<RemotePort>
```

## 🛠️ API エンドポイント

外部ツールから制御する場合のAPI仕様です。

| メソッド | エンドポイント | 説明 | パラメータ例 |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/processes` | 実行中のsocatプロセス一覧を取得 | なし |
| `POST` | `/api/start` | 新規転送を開始 | `{"localPort": 8080, "remoteHost": "192.168.1.5", "remotePort": 80, "protocol": "tcp"}` |
| `POST` | `/api/kill` | 指定PIDのプロセスを停止 | `{"pid": 1234}` |

## 🔒 セキュリティ上の注意

* **Root権限**: 本アプリはポート制御のために `root` 権限で動作します。信頼できる環境でのみ使用してください。
* **アクセス制限**: デフォルトでは認証機能がありません。インターネットに公開するサーバーで使用する場合は、ファイアウォール（UFW等）でポート3000へのアクセス元を制限するか、リバースプロキシ（Nginx等）を使用してBasic認証などを設定することを強く推奨します。

## 📄 ライセンス

MIT License
