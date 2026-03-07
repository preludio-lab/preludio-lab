#!/bin/bash
# git worktreeを作成し、開発環境をセットアップするスクリプト

set -e

# 引数の取得（ブランチ名、ディレクトリ名）
BRANCH_NAME=$1
DIR_NAME=$2


if [ -z "$BRANCH_NAME" ]; then
  echo "Usage: ./scripts/setup-worktree.sh <branch-name> [directory-name]"
  exit 1
fi

# ディレクトリ名が未指定の場合、ブランチ名から自動生成
if [ -z "$DIR_NAME" ]; then
  DIR_NAME="preludio-lab-${BRANCH_NAME//\//-}"
fi


# 親ディレクトリに展開するためのパス設定
WORKTREE_PATH="../$DIR_NAME"


echo "Creating worktree for branch '$BRANCH_NAME' at '$WORKTREE_PATH'..."

# ブランチの存在確認を行い、worktreeを追加
if git rev-parse --verify "$BRANCH_NAME" >/dev/null 2>&1; then
    # 既存ブランチを使用
    git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
else
    # ブランチが存在しない場合はmasterから新規作成
    echo "Branch '$BRANCH_NAME' does not exist. Creating from master..."
    git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" master
fi


# 環境設定ファイル（.env / .env.local）のコピー
echo "Copying environment files..."
for f in .env .env.local; do
    cp "$f" "$WORKTREE_PATH/$f" 2>/dev/null || echo "$f not found, skipping."
done

if [ -d "agents" ]; then
    mkdir -p "$WORKTREE_PATH/agents"
    for f in .env .env.local; do
        cp "agents/$f" "$WORKTREE_PATH/agents/$f" 2>/dev/null || echo "agents/$f not found, skipping."
    done
fi



# 新しいworktree先で依存関係のインストール
echo "Installing dependencies in worktree..."
cd "$WORKTREE_PATH"
pnpm install

if [ -d "agents" ]; then
    echo "Installing dependencies in agents directory..."
    cd agents
    pnpm install
    cd ..
fi


echo "✅ Worktree setup complete!"
echo "Navigate to: cd $WORKTREE_PATH"

