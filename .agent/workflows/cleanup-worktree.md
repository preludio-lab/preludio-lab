---
description: スレッド終了時にWorktreeとブランチを削除する
---

# 手順

このワークフローでは、作業が完了したWorktree環境とブランチを削除します。

## 1. 事前確認

- プルリクエストがマージされている（またはクローズされている）ことを確認してください。
- マージされていない変更がある場合、削除スクリプトはエラーになります。

## 2. ディレクトリ名の確認

削除対象のWorktreeディレクトリ名を確認します。

```bash
git worktree list
```

## 3. Worktreeの削除

以下のコマンドを実行してWorktreeとブランチを削除します。

// turbo

```bash
# ./scripts/remove-worktree.sh <directory-name>
./scripts/remove-worktree.sh preludio-lab-feat-example
```

> **Note:** 強制的に削除する場合（マージせずに破棄する場合など）は `-f` オプションを付けてください。
> `./scripts/remove-worktree.sh preludio-lab-feat-example -f`
