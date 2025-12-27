# データスキーマ設計 (Data Schema Design)

## 1. Frontmatterスキーマ定義 (MDX)
全てのMDXコンテンツは、以下のZodスキーマ定義に従う必要がある。

> [!NOTE]
> **用語解説 (Terminology)**
> *   **Frontmatter (フロントマター):** Markdownファイルの冒頭に記述する、記事のメタデータ（タイトル、日付、カテゴリなど）を定義する領域のこと。`---` で囲んで記述します。
> *   **Zod Schema (Zodスキーマ):** TypeScript用のバリデーションライブラリ「Zod」を用いて、「データが正しい形をしているか（型定義、必須項目、値の範囲など）」を厳密にチェックするための定義のこと。

```typescript
const ContentSchema = z.object({
  // Metadata (メタデータ)
  title: z.string().min(1),
  description: z.string().optional(), // SEO用メタディスクリプション
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  updated: z.string().optional(),

  // Taxonomy (分類)
  category: z.enum([
    'Introduction',  // 楽曲紹介 (Work Analysis)
    'Composer',      // 作曲家
    'Theory',        // 音楽理論
    'Era',           // 時代様式
    'Instrument',    // 楽器
    'Performer',     // 演奏家
    'Terminology',   // 用語集
    'Column',        // コラム
    'Originals'      // オリジナル
  ]),
  tags: z.array(z.string()).optional(),
  
  // Series (Optional: シリーズ機能)
  series: z.string().optional(), // シリーズのSlug
  seriesOrder: z.number().optional(), // シリーズ内での順序

  // Content Specific
  composer: z.string().optional(), // 例: "Johann Sebastian Bach". Introductionカテゴリでは必須
  work_id: z.string().optional(),  // 例: "BWV 846". Introductionカテゴリでは必須
  key: z.string().optional(),      // 例: "C Major"
  difficulty: z.number().min(1).max(5).optional(), // 1:初級 〜 5:超絶技巧

  // Media (メディア連携)
  thumbnail: z.string().optional(),    // OGP用画像パス
  youtube_id: z.string().optional(),   // メイン動画ID
  youtube_start: z.string().optional(),// 再生開始時間 (HH:MM:SS)
  youtube_end: z.string().optional(),  // 再生終了時間 (HH:MM:SS)
  ogp_excerpt: z.string().optional(),  // OGP生成用ABC譜面
});
```

## 2. ファイル構成 (File Organization)
採用案： `content/[lang]/[category]/[slug].mdx`
ファイルベースルーティングとローカライゼーションの管理を容易にするため、言語ディレクトリを最上位に置く。

ディレクトリ構成例:
```
content/
  ja/
    works/
      prelude-c-major.mdx
    composers/
      bach.mdx
  en/
    works/
      prelude-c-major.mdx
```

## 3. Taxonomy (分類)
詳細は `content-requirements.md` の [REQ-CONT-TAX-XXX] を参照。

## 4. TypeScript型定義 (Domain Entities)
アプリケーション内部では、以下の型定義 (`src/domain/entities/content.ts`) を使用してデータを扱う。

*   **`ContentSummary`**: 一覧表示、ナビゲーション、サイトマップ生成用。`body` (本文) を含まない軽量オブジェクト。
*   **`ContentDetail`**: 詳細ページ表示用。`ContentSummary` を継承し、`body` (MDX生テキスト) を含む。

```typescript
export type ContentSummary = {
    slug: string;
    lang: string;
    category: string;
    metadata: Metadata; // Zod Schema
};

export type ContentDetail = ContentSummary & {
    body: string;
};
```

## 5. データベーススキーマ (Database-First Master)

コンテンツ正本となるテーブル設計。AI編集の粒度に合わせた正規化を行う。

### 5.1 `articles` テーブル
記事の基本メタデータおよびSEO情報。

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_generate_v4() | PK |
| `slug` | text | - | URL Slug (Unique) |
| `lang` | text | - | Language Code |
| `title` | text | - | Title |
| `composer_id` | uuid | - | FK to composers |
| `is_public` | boolean | false | 公開フラグ |
| `last_synced_at` | timestamptz | - | Git同期日時 |

### 5.2 `sections` テーブル (Granular Content)
記事を構成するセクションブロック。AIの部分編集単位。

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_generate_v4() | PK |
| `article_id` | uuid | - | FK to articles |
| `order_index` | int | 0 | 表示順序 |
| `heading` | text | - | セクション見出し |
| `content_body` | text | - | Markdown本文 |
| `token_count` | int | - | トークン数（AI制御用） |
| `embedding` | vector(768) | - | セクション単位のベクトル（要約セクションのみ生成推奨） |

### 5.3 `music_scores` テーブル
楽譜データのリポジトリ。

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_generate_v4() | PK |
| `title` | text | - | 譜例タイトル |
| `format` | text | 'abc' | 'abc' or 'musicxml' |
| `data` | text | - | 楽譜データ本体 |
| `hash` | text | - | データハッシュ（重複検知用） |
