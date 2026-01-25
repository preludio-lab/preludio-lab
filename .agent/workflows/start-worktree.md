---
description: スレッド開始時に新規ブランチとWorktreeを作成する
---

# 手順

このワークフローでは、独立した作業環境（Git Worktree）を作成し、次回以降の作業をその環境で行えるようにします。

## 0.言語

- チャット、実装計画、ウォークスルーは日本語
- ソースコード中のコメントは日本語
- システムが出力するメッセージ（ログ等）は英語

## 1. ブランチ名の決定

- 必ず作業ブランチを切ること。masterブランチを直接修正してはいけない
- 修正のたびにコミット、プッシュすること
- 命名規則やコミットルールは @/docs/02_guidelines/deloymeny-guidelines.md に準拠する

## 2. Worktreeのセットアップ

以下のコマンドを実行してWorktreeを作成・初期化します。
`setup-worktree.sh` はブランチ作成、`.env`コピー、依存関係インストール(`pnpm install`)を一括で行います。

// turbo

```bash
# ./scripts/setup-worktree.sh <branch-name>
./scripts/setup-worktree.sh feat/example-branch
```

## 3. 確認

- `../preludio-lab-<branch-name>` ディレクトリが作成されていることを確認します。
- 必要であれば、新しいウィンドウでそのディレクトリを開いてください。
