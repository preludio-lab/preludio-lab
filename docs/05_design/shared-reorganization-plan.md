# ADR: Cross-cutting Concerns の整理と `src/shared` の新設

## 背景

プロジェクトの成長に伴い、i18n（多言語対応）、ロギング、エラーハンドリングなどの「特定のビジネスドメインに依存しないが全レイヤーから参照される機能（Cross-cutting Concerns）」の配置場所が課題となりました。

現状、i18nの実装は `src/infrastructure/i18n` に配置されていますが、以下の理由から再配置が必要です。

- ドメイン層（バリデーションメッセージ等）やUI層から直接参照される性質上、インフラ層に閉じ込めるのが不自然である。
- `src` 直下に独立したフォルダ（`src/i18n` 等）を増やすと、トップレベルのディレクトリが肥大化し、プロジェクトの全体像がボヤける懸念がある。

## 決定事項： `src/shared` フォルダの新設

共通機能を一括管理し、依存関係をクリーンに保つため、 `src/shared` ディレクトリを導入します。

- **名称**: `common` ではなく `shared` を採用。
  - `common` は「便利な道具箱（Utils）」というニュアンスが強い。
  - `shared` は「複数の異なるコンテキスト（Domain, UI, Infra）で共有される重要なコア」という意図を表す。
- **最初の構成要素**: `src/shared/i18n`
  - 旧 `src/infrastructure/i18n` から、メッセージファイル（JSON）、ルーティング、設定を一式移動。

## 今後の拡張性

以下の横断的関心事についても、順次 `src/shared` への集約を検討します。

- **Logging**: `src/shared/logging`（現在は `src/domain/shared/logger.ts` に一部存在）
- **Errors**: `src/shared/errors`（共通例外クラスの定義）
- **Shared Types**: `src/shared/types`（全レイヤーで使用する基本的な型定義）

## 実装計画（次回タスク）

1. **ディレクトリ作成**: `src/shared/i18n` の作成。
2. **ファイル移動**: `src/infrastructure/i18n/*` を移動。
3. **パス修正**:
   - `config.ts` 内のメッセージ読み込みパス。
   - `ArticleDetailFeature.tsx` 等のUIコンポーネントでのインポート。
   - `middleware.ts` などのルーティング設定。
4. **検証**: `npm run build` および既存のi18n機能のテスト。

## 利点

- **可読性**: `src` 直下が整理され、ビジネスドメイン（`src/domain`）と共通基盤（`src/shared`）の分離が明確になる。
- **依存の適正化**: Domain層がInfrastructure層に依存するという不自然な関係を解消できる。
- **一貫性**: システム全体の「共通部分」の家が決まることで、開発者が迷わなくなる。
