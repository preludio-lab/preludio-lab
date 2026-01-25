#!/bin/bash
set -e

DIR_NAME=$1
FORCE=$2

if [ -z "$DIR_NAME" ]; then
  echo "Usage: ./scripts/remove-worktree.sh <directory-name> [-f]"
  exit 1
fi

WORKTREE_PATH="../$DIR_NAME"

if [ ! -d "$WORKTREE_PATH" ]; then
  echo "Error: Directory '$WORKTREE_PATH' does not exist."
  exit 1
fi

# Get branch name from the worktree
pushd "$WORKTREE_PATH" > /dev/null
BRANCH_NAME=$(git branch --show-current)
popd > /dev/null

echo "Detected branch '$BRANCH_NAME' in '$WORKTREE_PATH'."

echo "Removing worktree..."
if [ "$FORCE" == "-f" ]; then
    git worktree remove "$WORKTREE_PATH" --force
else
    git worktree remove "$WORKTREE_PATH"
fi

if [ -n "$BRANCH_NAME" ]; then
    echo "Removing branch '$BRANCH_NAME'..."
    if [ "$FORCE" == "-f" ]; then
        git branch -D "$BRANCH_NAME"
    else
        git branch -d "$BRANCH_NAME" || echo "⚠️ Branch not deleted (probably not merged). Use -f to force delete."
    fi
fi

echo "✅ Worktree cleanup complete!"
