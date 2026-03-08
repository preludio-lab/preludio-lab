---
trigger: model_decision
description: ソースコード修正後、Push前に実施すべきCIチェックです
---

Push前に、全体的な整合性を確認するためのチェックです。
Formatter/Linterはコミット時に自動実行される（Husky）ため、ここでは**型チェック、フォーマット、テスト**に重点を置きます。

// turbo-all

1. **Type Check**: `pnpm run type-check`
   - ファイル単体ではなく、プロジェクト全体の型の整合性を確認します。
2. **Lint**: `pnpm run lint`
   - `pnpm run lint`等で発生したエラー（特に`@typescript-eslint/no-explicit-any`）を解消する際、**`eslint-disable` コメントを使用して握りつぶすことは固く禁じられています。** 必ず型の絞り込みや `unknown` を活用して本質的に修正してください。
3. **Format Check**: `pnpm prettier --check .`
   - Prettier フォーマット違反がないか確認します。GitHub Actions の CI でも同じチェックが走るため、ここで事前に検出して修正します。
   - エラーがあれば `pnpm prettier --write <files>` で修正してからコミットしてください。
   - **注意:** Husky の pre-commit フックは staged files のみに適用されるため、AI エージェントが複数ファイルを一括編集した場合にフォーマット漏れが発生しやすいです。
4. **Unit Test**: `pnpm run test`
   - 全体テストを実行し、リグレッションがないか確認します。
   - ※時間がかかる場合は、関連するテストのみ実行でも可
5. **Multi-Workspace & Phantom Dependencies (幽霊依存) Check**:
   - `Next.js (Root)`, `Agents`, `Workers` など複数のワークスペースが存在する場合や、パッケージマネージャー移行時は、Hoistingの挙動による暗黙的な依存関係エラーが発生しやすくなります。
   - 必ずすべてのワークスペースに対してLint, TypeCheck, UnitTest, Buildを網羅的に走らせてください。
