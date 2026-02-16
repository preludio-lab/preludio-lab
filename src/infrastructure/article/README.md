# Article インフラストラクチャ (src/infrastructure/article)

Article インフラは、記事のメタデータ（タイトル、投稿日、カテゴリーなど）と、コンテンツ本体（MDXファイル）の二重管理を効率的に行うための実装を提供します。

## アーキテクチャ概要

記事データは以下の2箇所に分散して保存されます：

1. **Metadata (DB)**: 記事の属性情報、翻訳データ。検索や一覧取得に使用（Turso / SQLite）。
2. **Payload (Storage)**: 記事の本文（MDX）。詳細表示時にのみ取得（Cloudflare R2 / ローカルファイルシステム）。

これらを `ArticleRepositoryImpl` が統合し、ドメイン層からは一つのアグリゲート（ `Article` ）として扱えるようにしています。

## コンポーネント構成

### 1. Repository (`article.repository.ts`)

`BasePayloadRepository` を継承し、メタデータとペイロードの保存・取得・削除の不整合を防ぐ「Storage First」戦略を実装しています。

### 2. Factory (`article.factory.ts`)

環境設定 (`infraConfig`) に基づいて、適切な DataSource と Storage を組み合わせたシングルトンインスタンスを生成します。

- **Cloud**: Turso (Metadata) + Cloudflare R2 (Payload)
- **Local**: SQLite (Metadata) + File System (Payload)

### 3. Metadata 関連 (`metadata/`)

- `article.metadata.ds.ts`: DBアクセスのための共通インターフェース。
- `turso.article.metadata.ds.ts`: Drizzle ORM を使用した Turso/SQLite 実装。
- `turso.article.metadata.mapper.ts`: DB行（TableRow）とドメインサマリー（ArticleSummary）の相互変換。

### 4. Content 関連 (`content/`)

- `article.content.mapper.ts`: MDX文字列のパース。`gray-matter` を使用し、フロントマターの除去と本文の抽出を行います。
- `article.path.strategy.ts`: 記事の ID や言語に基づいて、ストレージ上のパス（例: `articles/123/ja.mdx`）を決定します。

## 重要な実装規則

### フロントマターの扱い

MDX ファイルにはメタデータ（Frontmatter）が含まれていることがありますが、DBへの同期（ `sync-articles` スクリプトなど）が行われた後は、フロントマターの内容はDBのメタデータが正文となります。アプリケーションで MDX を表示する際は、Mapper を通じてフロントマターを除去した本文のみを使用します。

### 言語と翻訳

記事は `ArticleMaster` に紐づく複数の `ArticleTranslation`（各言語版）として管理されます。特定の言語版を削除した際、その記事に翻訳が一つも残らなくなった場合に限り、Master レコードも自動的に削除されます。
