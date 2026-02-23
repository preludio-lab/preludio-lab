---
trigger: model_decision
description: ソースコード修正後、Push前に実施すべきCIチェックです
---

Push前に、全体的な整合性を確認するためのチェックです。
Formatter/Linterはコミット時に自動実行される（Husky）ため、ここでは**型チェックとテスト**に重点を置きます。

1. **Type Check**: `pnpm run type-check`
   - ファイル単体ではなく、プロジェクト全体の型の整合性を確認します。
2. **Unit Test**: `pnpm run test`
   - 全体テストを実行し、リグレッションがないか確認します。
   - ※時間がかかる場合は、関連するテストのみ実行でも可
3. **Multi-Workspace & Phantom Dependencies (幽霊依存) Check**:
   - `Next.js (Root)`, `Agents`, `Workers` など複数のワークスペースが存在する場合や、パッケージマネージャー移行時は、Hoistingの挙動による暗黙的な依存関係エラーが発生しやすくなります。
   - 必ずすべてのワークスペースに対してLint, TypeCheck, UnitTest, Buildを網羅的に走らせてください。
