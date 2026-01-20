# マスタデータ管理・生成ワークフロー

## 1. 概要 (Overview)

本ドキュメントでは、PreludioLabにおけるマスタデータ（Composer, Work等）の管理および生成ワークフローについて定義します。
10,000記事規模の運用を見据え、**「GitをSingle Source of Truthとし、AIとの協業を前提としたマスタデータ管理」** を行います。

## 2. ディレクトリ構成 (Directory Structure)

「データ（Facts）」と「コンテンツ（Narratives）」を明確に分離します。

```text
data/               # マスタデータ (JSON) - DB同期用
├── composers/      # 作曲家マスタ
│   └── {slug}.json
└── works/          # 楽曲マスタ
    └── {composer_slug}/
        └── {work_slug}.json
```

- **`data/`**: アプリケーションから参照される「事実」情報。DBへ同期されます。

## 3. データ設計方針 (Data Design Policy)

### 3.1 i18n戦略: ハイブリッドアプローチ

JSONファイルの肥大化を防ぎ、管理効率を高めるため、情報の性質に応じて管理場所を分けます。

- **Master Data (JSON in `data/`)**:
  - 名前、タイトル、調性、日付などの「事実」や「短いラベル」。
  - `locales` オブジェクト内で多言語テキストを管理します。
  - DB同期時にクエリ可能な状態で格納されます。

- **Content (MDX in `content/`)**:
  - 解説文、バイオグラフィなどの「長文ナラティブ」。
  - 言語ごとにファイルまたはディレクトリを分けて管理します。

### 3.2 ID管理: Slug vs UUID

- **Git管理 (Human/AI-Readable)**: **Slug**
  - 人間やAIが識別しやすい `slug` (例: `beethoven`, `symphony-no5`) を主キーとして扱います。
  - ファイル名もSlugと一致させます。

- **DB管理 (System-Robustness)**: **UUID**
  - リレーショナルデータベースとしての整合性を保つため、内部的には **UUID v7** を使用します。

## 4. 同期ワークフロー (Sync Workflow)

GitHub Actions上で実行されるスクリプトにより、JSONデータがTursoデータベースへ同期されます。

### 4.1 Sync Logic (Slug-to-UUID Resolution)

1. **Read**: JSONファイル (`slug`) を読み込み。
2. **Resolve**: Databaseを `slug` で検索。
   - `SELECT id FROM works WHERE slug = ?`
3. **Upsert**:
   - **存在する場合**: 取得した `id` を使用して `UPDATE`。
   - **存在しない場合**: 新規に `UUID` を生成して `INSERT`。

### 4.2 Incremental Sync (増分同期)

全件同期のコストを避けるため、`git diff` を利用して変更されたファイルのみを同期対象とします。

## 5. スキーマ定義 (Schema Definitions)

データの型定義およびバリデーションには **Zod** を使用します。
ドメインごとにスキーマ定義ファイルを分割しています。

- **Composer**: `src/domain/composer/composer.schema.ts`
- **Work**: `src/domain/work/work.schema.ts`

### 5.1 バリデーションルール

- 必須項目（Slug, Title等）の欠落チェック。
- 多言語フィールド（`locales`）における必須言語（`en`, `ja`）のチェック。
- 列挙型（時代区分、ジャンル等）の適合性チェック。
