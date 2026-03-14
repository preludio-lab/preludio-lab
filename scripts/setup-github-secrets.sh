#!/bin/bash

# ==============================================================================
# GitHub Secrets セットアップスクリプト
# ------------------------------------------------------------------------------
# ローカルの .env.local ファイルからシークレットを読み込み、GitHub Actions の
# Repository Secrets に一括設定します。
#
# 依存ツール: GitHub CLI (gh)
# ==============================================================================

# 1. 依存関係のチェック
if ! command -v gh &> /dev/null; then
    echo "Error: github-cli (gh) がインストールされていないか、PATHが通っていません。"
    echo "インストール後、'gh auth login' でログインしてから再試行してください。"
    exit 1
fi

# 2. シークレット設定用ヘルパー関数
# 引数: $1:シークレット名, $2:ファイルパス (オプション, デフォルトは .env.local)
set_secret() {
    local key=$1
    local env_file=$2
    [ -z "$env_file" ] && env_file=".env.local"
    
    # ファイルの存在確認
    if [ ! -f "$env_file" ]; then
        return 1
    fi

    # 値の抽出 (行頭から KEY= で始まる行を取得し、クォートを除去)
    local value=$(grep "^${key}=" "$env_file" | cut -d '=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    if [ -n "$value" ]; then
        echo "Setting secret: ${key} (from $env_file)..."
        echo -n "$value" | gh secret set "$key"
        return 0
    fi
    return 1
}

echo "GitHub Secrets のセットアップを開始します..."

# 3. 各シークレットの設定実行

# --- Turso 関連 (マスタデータ同期に必要) ---
# ルートの .env.local から取得を試みる
set_secret "TURSO_DATABASE_URL" || echo "Warning: TURSO_DATABASE_URL が見つかりません（スキップ）"
set_secret "TURSO_AUTH_TOKEN"   || echo "Warning: TURSO_AUTH_TOKEN が見つかりません（スキップ）"

# --- AI エージェント関連 (GEMINI_API_KEY) ---
# 1. まずルートの .env.local を確認
# 2. なければ agents/.env.local を確認
set_secret "GEMINI_API_KEY" || \
set_secret "GEMINI_API_KEY" "agents/.env.local" || \
echo "Warning: GEMINI_API_KEY がルートおよび agents/.env.local に見つかりません（スキップ）"

# --- Vercel 関連 (セキュリティスキャンや E2E テストのバイパスに使用) ---
set_secret "VERCEL_AUTOMATION_BYPASS_SECRET" || echo "Warning: VERCEL_AUTOMATION_BYPASS_SECRET が見つかりません（スキップ）"

echo "------------------------------------------------------------------------------"
echo "Success: すべての設定処理が完了しました。"
echo "GitHub リポジトリの Settings > Secrets and variables > Actions で確認できます。"
