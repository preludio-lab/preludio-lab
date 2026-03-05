---
description: SCA (Dependabot等) による依存関係アップデートPRを安全かつ効率的に処理するワークフロー
---

このワークフローは、SCA（Software Composition Analysis）ツールや Dependabot によって作成された依存関係アップデート PR を、プロジェクトの品質基準（Node.js 22 LTS / pnpm 10）に準拠させながら統合するための手順です。

Weekly で発生する「定型的な脆弱性対応・アップデート対応」の自動化と品質担保を目的とします。

# 1. PR リストの確認とフィルタリング

// turbo

1. `gh pr list --state open --search "chore(deps" ` または `gh pr list --author "app/dependabot"` を実行し、SCA 関連 PR（`chore(deps)` や `chore(deps-dev)`）を抽出する。
2. 各 PR の変更内容と、現在のプロジェクトの制約（Node.js 22 LTS, pnpm 10）を照合する。

# 2. 不正・不適切な PR の棄却 (Fail-Fast)

以下に該当する PR は、開発環境の破壊を防ぐため、マージせずに理由を添えてクローズする。

- **異常バージョン**: Node.js の未リリース版 (v25等) や、セマンティックバージョニングを無視したタグ提案。
- **ランタイム不一致**: デプロイ環境（Vercel: Node.js 22）でサポートされていないメジャーバージョンのランタイム・型定義更新。

# 3. 構成の整合性チェック

PR を処理する前に、リポジトリが以下の「保護設定」に従っているか確認する。不足している場合は適宜追加・修正を行う。

- **`.node-version`**: 値が `22` であること。
- **`.npmrc`**: `engine-strict=true` が設定されていること。
- **`package.json`**: `engines.node` が `22.x`、`packageManager` が `pnpm@10.x` であること。
- **Dependabot Grouping**: `.github/dependabot.yml` でマイナー/パッチ更新がグループ化され、PR fatigue（PR疲れ）が抑制されていること。

# 4. 検証とマージ手順

// turbo

1. 作業ブランチで対象の PR をマージ（または Rebase）し、コンフリクトを解消する。
2. コンフリクト解消は、エディタ上での手動編集ではなく、`pnpm install` を実行してロックファイル（`pnpm-lock.yaml`）を自動再構築させる。
3. ローカル検証を実行する。
   ```bash
   pnpm run type-check && pnpm run test
   ```
4. 修正をプッシュし、CI（GitHub Actions）が全て成功することを確認する。
5. マージ時は `Rebase and Merge` を推奨し、完了後に作業ブランチを削除する。

# 5. 回顧 (Retrospective)

今回の対応で新しく検知した「無視すべきパッケージ」や「固定すべきバージョン」があれば、`/retrospective` を通じて `.agent/rules/` や `.github/dependabot.yml` にフィードバックを反映する。
