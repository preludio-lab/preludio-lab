# インフラストラクチャ層 (src/infrastructure)

インフラストラクチャ層は、ドメイン層で定義されたインターフェースを実装し、外部システム（データベース、オブジェクトストレージ、外部APIなど）との詳細なやり取りを管理します。

## 役割

- **ドメインインターフェースの実装**: `domain/repositories` などで定義された契約を具体的に実装します。
- **外部システムへのアダプター**: Turso (DB), Cloudflare R2 (Storage), ファイルシステムなどの具体的な操作を隠蔽します。
- **技術的詳細の隔離**: 特定のライブラリやプロトコルの変更がドメイン層に波及しないようにします。

## ディレクトリ構成

- `shared/`: リポジトリの基底クラス、共通設定など。
- `article/`: 記事に関連するインフラ実装（Metadata + Payload）。
- `database/`: Drizzle ORM の設定、スキーマ定義、トランザクション管理、マイグレーション。
- `storage/`: Cloudflare R2 やファイルシステムへのアクセスクライアント。
- `logging/`: システム全体のロギング実装。

## 命名規則と構成要素

| 要素           | 命名規則          | 役割                                                                  |
| :------------- | :---------------- | :-------------------------------------------------------------------- |
| **Repository** | `*.repository.ts` | ドメインインターフェースの実装。DataSource を組み合わせて集約を管理。 |
| **DataSource** | `*.ds.ts`         | DB や API への低レイヤーなアクセス。I/O に特化したインターフェース。  |
| **Mapper**     | `*.mapper.ts`     | 永続化データ（Row）とドメインオブジェクト（Entity）の相互変換。       |
| **Factory**    | `*.factory.ts`    | 環境変数（infraConfig）に基づいて適切なインスタンスを生成。           |

## 実装ルール

### 1. 基底リポジトリの活用

新規にリポジトリを作成する場合は、`src/infrastructure/shared/base.repository.ts` を継承することを検討してください。これにより、エラーハンドリングやページング、ロギングの共通処理を再利用できます。

- `BaseMetadataRepository`: DB などのメタデータのみを扱う場合。
- `BasePayloadRepository`: DB（メタデータ）とオブジェクトストレージ（ペイロード）の両方を扱う場合。

### 2. 例外処理

外部システムで発生したエラーはそのままドメイン層に流さず、`AppError` ( domain/shared/app-error.ts ) にラップして投げ直します。その際、エラーコード ( `INFRASTRUCTURE_ERROR` など ) を付与し、元のエラー ( `cause` ) を保持します。

```typescript
try {
  // 外部アクセス
} catch (err) {
  throw new AppError('Failed to fetch data', 'INFRASTRUCTURE_ERROR', 500, err);
}
```

### 3. ロギング

`src/shared/logging/logger.ts` の `Logger` インターフェースを使用し、環境ごとに実装されたシングルトン（`serverLogger`, `clientLogger`, `cliLogger`）を用いて、重要な操作の開始/終了、エラー、警告を記録します。インフラ層では、外部システムとのやり取りに関する詳細（ID、パス、エラー内容など）を積極的にログに出力してください。

### 4. 設定管理

特定の環境変数に直接 `process.env` でアクセスせず、`src/infrastructure/shared/config/` を介して設定を取得してください。

## テスト指針

- **モック**: リポジトリのテストでは、依存する DataSource や Storage をモック化してロジックを検証します。
- **インテグレーション**: 必要に応じて、ローカル（SQLite/FS）環境での統合テストを実施してください。
