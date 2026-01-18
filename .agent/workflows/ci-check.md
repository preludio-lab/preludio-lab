---
trigger: model_decision
description: ソースコード修正後、Push前に実施すべきCIチェックです
---

Push前に、全体的な整合性を確認するためのチェックです。
Formatter/Linterはコミット時に自動実行される（Husky）ため、ここでは**型チェックとテスト**に重点を置きます。

1. **Type Check**: `npm run type-check`
   - ファイル単体ではなく、プロジェクト全体の型の整合性を確認します。
2. **Unit Test**: `npm run test`
   - 全体テストを実行し、リグレッションがないか確認します。
   - ※時間がかかる場合は、関連するテストのみ実行でも可
