#!/bin/bash

# .env.local からシークレットを読み込み GitHub Actions の Secrets に設定するスクリプト

# 依存コマンドの確認
if ! command -v gh &> /dev/null; then
    echo "Error: github-cli (gh) がインストールされていないか、PATHが通っていません。"
    echo "インストール後、'gh auth login' でログインしてから実行してください。"
    exit 1
fi

if [ ! -f .env.local ]; then
    echo "Error: .env.local ファイルが見つかりません。"
    exit 1
fi

set_secret() {
    local key=$1
    local env_file=$2
    [ -z "$env_file" ] && env_file=".env.local"
    
    if [ ! -f "$env_file" ]; then
        return
    fi

    local value=$(grep "^${key}=" "$env_file" | cut -d '=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    if [ -n "$value" ]; then
        echo "Setting secret: ${key} (from $env_file)..."
        echo -n "$value" | gh secret set "$key"
        return 0
    fi
    return 1
}

# Turso (Master Data Sync に必要)
set_secret "TURSO_DATABASE_URL"
set_secret "TURSO_AUTH_TOKEN"

# AI Agents (GEMINI_API_KEY)
# ルートまたは agents/.env.local から検索
set_secret "GEMINI_API_KEY" || set_secret "GEMINI_API_KEY" "agents/.env.local"

# Vercel (DAST Scan / E2E Test でのバイパスに使用)
set_secret "VERCEL_AUTOMATION_BYPASS_SECRET"

echo "GitHub Secrets の設定が完了しました。"
