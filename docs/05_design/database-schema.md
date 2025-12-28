# データベーススキーマ設計 (Database Schema Design)

本ドキュメントでは、PreludioLabのデータ永続化層（PostgreSQL on Supabase）の物理設計を定義します。
[Search Requirements](./search-requirements.md) で定義された「Read-Optimized (Zero-JOIN)」戦略に基づき、検索パフォーマンスと開発者体験を最優先した設計となっています。

## 1. Design Policy (設計方針)

### 1.1 Read-Optimized / Zero-JOIN
検索・一覧表示のパフォーマンスを最大化するため、頻繁にアクセスされる属性（作曲家名、曲名、ジャンル等）を `Articles` テーブル群に**非正規化（Denormalization）**して保持します。
これにより、ユーザーアクセス時の複雑な JOIN を排除します。

### 1.2 Enterprise Standards
*   **Audit Trails:** 全テーブルに `created_at` (Immutable), `updated_at` (Triggerにより自動更新) を持たせます。
*   **Surrogate Keys:** 主キーには **UUID v7** (時間ソート可能) を採用します。外部システム（Storage path等）との親和性を高めます。
*   **Naming Convention:**
    *   Table/Column: `snake_case` (Postgres Standard)
    *   API Response: `CamelCase` (Application Layerで変換)

### 1.3 Security (RLS)
**"Secure by Default"** を徹底します。
すべてのテーブルで RLS (Row Level Security) を有効化し、明示的なポリシーがない限りアクセスを拒否します。

---

## 2. ER Diagram (Entity Relationship)

```mermaid
erDiagram
    %% Masters (Reference)
    Composers ||--|{ ComposerTranslations : "has localized"
    Composers ||--|{ Works : "composed"
    Works ||--|{ WorkTranslations : "has localized"
    
    %% Application Core (Zero-JOIN)
    Works ||--o{ Articles : "featured in"
    Articles ||--|{ ArticleTranslations : "has localized content"
    
    %% Shared Assets
    Works ||--o{ Scores : "has sheet music"
    Scores ||--|{ ScoreTranslations : "has localized metadata"

    classDetails {
        %% Color Definitions
        class Composers,Works,Articles,Scores master_table
        class ComposerTranslations,WorkTranslations,ArticleTranslations,ScoreTranslations localized_table
    }
```

---

## 3. Core Tables: Articles (Application Data)

記事管理の中核テーブル。検索要件に基づき、多くの属性を非正規化して持ちます。

### 3.1 `articles` (Universal)
言語に依存しない、記事の存在そのものを管理する親テーブル。

| Column | Type | Default | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | `uuid_generate_v7()` | NO | **PK**. UUID v7 (Time-sortable) |
| `work_id` | `uuid` | - | YES | FK to `works.id`. 記事に関連する主作品（あれば） |
| `slug` | `text` | - | NO | **Universal Slug**. URLの一部 (`/works/[slug]`) |
| `is_featured` | `boolean` | `false` | NO | おすすめ/キュレーション対象フラグ |
| `created_at` | `timestamptz` | `now()` | NO | 作成日時 |
| `updated_at` | `timestamptz` | `now()` | NO | 更新日時 (Trigger) |

### 3.2 `article_translations` (Localized / Read-Optimized)
言語ごとの記事データ。**検索用カラム（非正規化データ）をここに集約します。**

| Column | Type | Default | Nullable | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`id`** | `uuid` | `uuid_generate_v7()` | NO | **PK**. |
| `article_id` | `uuid` | - | NO | FK to `articles.id` |
| `lang` | `text` | - | NO | ISO Language Code ('ja', 'en'...) |
| **`status`** | `text` | `'draft'` | NO | 'draft', 'published', 'private', 'archived' |
| `title` | `text` | - | NO | 記事のH1タイトル |
| **`display_title`** | `text` | - | NO | **[Denormalized]** 一覧表示用タイトル |
| **`sl_composer_name`** | `text` | - | YES | **[Denormalized]** 作曲家名 (Search Key) |
| **`sl_catalogue_id`** | `text` | - | YES | **[Denormalized]** 作品番号 (Search Key) |
| **`sl_genre`** | `text` | - | YES | **[Denormalized]** ジャンル/カテゴリ |
| **`sl_instrumentation`**| `text`| - | YES | **[Denormalized]** 楽器編成 |
| **`sl_era`** | `text` | - | YES | **[Denormalized]** 時代区分 |
| **`sl_nationality`** | `text` | - | YES | **[Denormalized]** 地域/国籍 |
| `published_at` | `timestamptz` | - | YES | 公開日時 |
| `storage_path` | `text` | - | YES | ストレージ上のMDXパス (`article/{uuid}.mdx`) |
| `metadata` | `jsonb` | `{}` | NO | その他メタデータ (Tags, Key, Difficulty) |
| `content_structure` | `jsonb` | `{}` | NO | 目次構成データ (Search/Preview用) |
| `created_at` | `timestamptz` | `now()` | NO | - |
| `updated_at` | `timestamptz` | `now()` | NO | - |

> **Naming Note:** 非正規化カラムには `sl_` (Snapshot / Search Layer) プレフィックスを付ける案もありましたが、開発者の利便性を考え、通常のカラム名 (`composer_name` 等) とし、API層で管理します。ここでは分かりやすく `sl_` と記述していますが、実際の実装では `composer_name` とします。

**Indexes:**
*   `article_translations(lang, status)`: 基本フィルタリング
*   `article_translations(lang, sl_genre)`: ジャンル検索
*   `article_translations` GIN (`metadata`): タグ検索 (`metadata -> 'tags'`)

### 3.3 JSONB Type Definitions (Application Layer)
DB上の `jsonb` カラムに格納されるデータ構造のTypeScript定義（厳密なスキーマ）。

#### `content_structure` (Visual Outline)
記事の目次やプレビュー表示に使用される軽量な構造データ。
```typescript
type ContentStructure = Section[];

type Section = 
  | { id: string; type: 'text'; heading: string; level: 2 | 3 } // 目次用
  | { id: string; type: 'score'; work_id: string; caption?: string } // 譜例プレビュー用
  | { id: string; type: 'youtube'; videoId: string; start: number } // 動画プレビュー用
```

#### `metadata` (Search Attributes)
検索やフィルタリングに使用される補完的な属性群。
```typescript
type ArticleMetadata = {
  tags: string[];         // e.g. ["Sad", "Morning", "Baroque"]
  key?: string;           // e.g. "C Major"
  difficulty?: 1 | 2 | 3 | 4 | 5;
  ogp_url?: string;       // Generated OGP Image URL
};
```

---

## 4. Asset Tables: Scores

楽譜ビュワーで使用するデータ。

### 4.1 `scores` (Universal Asset)
| Column | Type | Description |
| :--- | :--- | :--- |
| **`id`** | `uuid` | **PK** |
| `work_id` | `uuid` | FK to `works.id` |
| `format` | `text` | 'abc', 'musicxml' |
| `data` | `text` | 楽譜データ実体 (Text format) |
| `created_at` | `timestamptz` | |

### 4.2 `score_translations` (Localized Metadata)
楽譜のキャプションや説明文。
| Column | Type | Description |
| :--- | :--- | :--- |
| **`id`** | `uuid` | **PK** |
| `score_id` | `uuid` | FK to `scores.id` |
| `lang` | `text` | 'ja', 'en'... |
| `caption` | `text` | 譜例のタイトル (e.g. "第1主題") |
| `description` | `text` | 補足説明 |

---

## 5. Master Tables: Composers & Works

正規化された参照用データ（信頼できる情報源）。記事作成時の入力補助や、Batch処理によるデータ整合性チェックに使用します。
**Zero-JOIN戦略のため、ユーザーアクセス時にこのテーブルがJOINされることは基本ありません。**

### 5.1 `composers` / `composer_translations`
*   `composers`: `id`, `slug`, `born_at`, `died_at`, `nationality_code`
*   `composer_translations`: `id`, `composer_id`, `lang`, `name` (Local Name), `bio`

### 5.2 `works` / `work_translations`
*   `works`: `id`, `composer_id`, `catalogue_id` (Unified), `key_tonality`
*   `work_translations`: `id`, `work_id`, `lang`, `title`, `popular_title`

---

## 6. RLS Policies (Security)

### Public Access (Anonymous)
*   **Articles:** `status = 'published'` AND `published_at <= NOW()` のレコードのみ `SELECT` を許可。
*   **Masters (Composers/Works):** 全件 `SELECT` 許可（公共情報のため）。
*   **Scores:** 関連する `Articles` が閲覧可能な場合のみ許可（またはPublic許可）。

### Admin Access (Service Role)
*   全テーブルに対して `ALL` (SELECT, INSERT, UPDATE, DELETE) を許可。

---

## 7. Verification & Migration Strategy

本スキーマの実装と検証は、以下の戦略で進めます。

### 7.1 Migration Workflow
Suapbase CLI (Local Development) を使用します。
1.  **Draft:** `docs/05_design/database-schema.md` (本ドキュメント) を正本とします。
2.  **Generate:** `supabase migration new create_tables`
3.  **Implement:** SQLファイル手動作成、またはStudioで作成して `db diff`。
4.  **Apply:** `supabase db reset` (Local).

### 7.2 Verification
*   **Static Check:** `db pull` した型定義 (`src/types/supabase.ts`) と、ドメインエンティティの一致確認。
*   **Data Integrity:** サンプルデータを投入し、`zod` スキーマ (`mdx-article-specs.md`) を通過することを確認。
*   **Performance:** `EXPLAIN ANALYZE` を使用し、Zero-JOIN クエリ（基本属性検索）が Index Scan となることを確認。
