# データベース インフラストラクチャ (src/infrastructure/database)

データベース インフラは、Drizzle ORM を使用した Turso (SQLite) へのアクセス、スキーマ定義、およびトランザクション管理を提供します。

## コンポーネント構成

### 1. トランザクション管理 (`turso.transaction-manager.ts`)

`TransactionManager` インターフェースを実装した `TursoTransactionManager` を提供します。
Drizzle のトランザクション機能を抽象化し、ドメイン層から特定のライブラリに依存せずにトランザクションを制御できます。

### 2. クライアントとユーティリティ

- `turso.client.ts`: Turso / LibSQL クライアントの初期化。
- `drizzle-utils.ts`: Drizzle で使用する共通のユーティリティ関数。

### 3. スキーマ定義 (`schema/`)

データベースのテーブル定義とリレーション設定を管理します。

## 重要な実装規則

### トランザクションの伝搬

`TursoTransactionManager.run` を介して実行されるコールバック内では、Drizzle のトランザクションクライアントがコンテキストとして渡されます。リポジトリや DataSource は、このコンテキストを使用して同一トランザクション内でクエリを実行できるように設計する必要があります。
