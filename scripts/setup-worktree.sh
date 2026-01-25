#!/bin/bash
set -e

BRANCH_NAME=$1
DIR_NAME=$2

if [ -z "$BRANCH_NAME" ]; then
  echo "Usage: ./scripts/setup-worktree.sh <branch-name> [directory-name]"
  exit 1
fi

if [ -z "$DIR_NAME" ]; then
  DIR_NAME="preludio-lab-${BRANCH_NAME//\//-}"
fi

WORKTREE_PATH="../$DIR_NAME"

echo "Creating worktree for branch '$BRANCH_NAME' at '$WORKTREE_PATH'..."

if git rev-parse --verify "$BRANCH_NAME" >/dev/null 2>&1; then
    git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
else
    echo "Branch '$BRANCH_NAME' does not exist. Creating from master..."
    git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" master
fi

echo "Copying environment files..."
cp .env $WORKTREE_PATH/.env 2>/dev/null || echo ".env not found, skipping."
cp .env.local $WORKTREE_PATH/.env.local 2>/dev/null || echo ".env.local not found, skipping."

echo "Installing dependencies in worktree..."
cd $WORKTREE_PATH
pnpm install

echo "✅ Worktree setup complete!"
echo "Navigate to: cd $WORKTREE_PATH"
