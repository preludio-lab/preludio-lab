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
    local value=$(grep "^${key}=" .env.local | cut -d '=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    if [ -z "$value" ]; then
        echo "Warning: .env.local 内に ${key} が見つからないか空です。スキップします。"
    else
        echo "Setting secret: ${key}..."
        echo -n "$value" | gh secret set "$key"
    fi
}

# Turso (Master Data Sync に必要)
set_secret "TURSO_DATABASE_URL"
set_secret "TURSO_AUTH_TOKEN"

# AI Agents (agent-runner.yml で使用)
set_secret "GOOGLE_GENERATIVE_AI_API_KEY"

# Vercel (DAST Scan / E2E Test でのバイパスに使用)
set_secret "VERCEL_AUTOMATION_BYPASS_SECRET"

echo "GitHub Secrets の設定が完了しました。"
