# データベース記事管理システム設計書 (database-article-management-design.md)

## 1. 概要
本ドキュメントは、**Supabase Database** を記事の正本（Source of Truth）とし、AIエージェントによる効率的な制作・管理を行う「Database-First Article Application」の仕様を定義します。
Gitは、DBデータの「バックアップ」および「静的サイト生成(SSG)ソース」として位置付けます。

## 2. 前提条件と制約 (Constraints)
- **Supabase Database:** 500MB Free Limit (Master).
- **GitHub:** Output Target for Backup & Build.
- **Scale:** 70,000 Articles (Granular Sections).

## 3. Database-First Configuration

### 3.1 Status Management (Architecture Decision)
記事の公開ステータス（Draft / Published / Archived）は **RDBMS (`article_translations` table)** で管理します。
- **Reason:**
  - **Filtering:** `WHERE status = 'published'` というクエリで即座に公開記事のみを取得するため。Object Storage内のFrontmatter管理ではリスティングや検索が低速になるため採用しません。
  - **Security (RLS):** DBのRow Level Securityにより、非公開記事へのアクセスをAPIレベルで確実に遮断するため。

### 3.2 Data Source Roles & Persistence Matrix (Split-Storage)

**容量見積もり (1.2GB) に基づき、記事本文のみ外部Storageへ分離します。**
詳細は `docs/05_design/database_capacity_estimation.md` を参照してください。
ただし、アプリケーション(Admin)からは透過的に扱います。

| Data Category | Master Storage Strategy | Data Format | Service (Physical Location) | Note |
| :--- | :--- | :--- | :--- | :--- |
| **Metadata (Key Fields)** | **RDBMS** | `String` / `UUID` | **Supabase DB** | 検索・結合用（フィールド単位でカラム化） |
| **Metadata (Flexible)** | **RDBMS** | `JSONB` | **Supabase DB** | UI表示用テキスト、追加属性。 |
| **Scores (Notation)** | **RDBMS** | `Text` (ABC / MusicXML) | **Supabase DB** | 楽譜データ本体。共有リソース。 |
| **Summary / Embeddings** | **RDBMS** | `Text` / `Vector (16-bit)` | **Supabase DB** | Semantic Search & Recommendation. |
| **Article Body (Draft)** | **Object Storage** | `MDX` (Text) | **Supabase Storage** (Private Bucket) | 執筆中データ。Auth/RLS保護。 |
| **Article Body (Public)** | **Object Storage** | `MDX` (Text) | **Cloudflare R2** (Public Bucket) | 公開用正本。閲覧性に優れるMDXを採用。 |

- **Supabase Database (Master Index):**
  - 記事メタデータ、楽譜データ、要約を保持 (Total ~330MB < 500MB).
- **Supabase Storage (Draft Store):**
  - 執筆中のドラフトデータを一時保存。Authとの連携を重視。
- **Cloudflare R2 (Public Body Store):**
  - **公開後の本文MDXの正本。**
  - Supabaseの1GB制限 (900MB利用でほぼ満杯) を回避するため、10GB無料のR2を採用。
- **GitHub (Code Repository):**
  - **Application Code Only.**
  - 70,000記事のMDXファイルは **Git管理しません** (Repo肥大化防止のため)。
  - ビルド時 (`generateStaticParams`) に Supabase から直接データを取得してページを生成します。

### 3.3 Workflow: Direct DB Build Flow
1.  **Edit:**
    - **Human:** Admin UI (Visual Editor) で編集。
    - **AI Agent:** DB直接接続 または API経由 (Headless) でデータを生成・更新。
2.  **Publish:** ステータスを公開に変更。
3.  **Revalidate:** On-demand ISR APIを叩き、Next.jsキャッシュを更新 (+ Pagefind Index更新)。

### 3.4 Editor Stack (Admin UI)
- **Framework:** Next.js (App Router)
- **Editor:** Tiptap / Lexical
- **AI Integration:** Vercel AI SDK (Streaming edits).

## 4. データ構造戦略 (MDX Split-Storage Model)
「執筆・レビューの容易性」と「配信パフォーマンス」を両立させるため、**Metadata in DB / Body in Storage (MDX)** の分離構成を採用します。

- **Normalized Metadata:** `articles` テーブルで親エンティティを正規化して管理し、検索性と整合性を担保。
- **MDX Body:** 記事本文はパース前の **Raw MDX** としてObject Storageに保存。
  - **Why MDX?**
    - **Human Readable:** JSON構造に変換せずそのまま保存することで、デバッグや簡易レビューが容易。
    - **Standard Tooling:** `next-mdx-remote` 等の標準エコシステムを変換なしで利用可能。
    - **Agent Friendly:** LLMはMarkdownの読み書きに長けており、JSON構造の制約を受けるよりも自由にかつ高精度に編集可能。

### 4.1 Storage Key Strategy (UUID vs Slug)
Object Storage上のファイル名は、Slugではなく **UUID (Record ID) を使用します。**

- **Format:** `article/{uuid}.mdx` (e.g. `article/550e8400-e29b-41d4-a716-446655440000.mdx`)
- **Reason:**
  - **Slug is Mutable:** URL変更によりSlugが変わった場合、Storage上のファイル移動（Copy+Delete）が発生し、整合性担保が困難になるため。
  - **UUID is Immutable:** 記事の親が移動したりタイトルが変わったりしても、コンテンツ実体へのリンクは不変に保たれる。

## 5. Performance Strategy

### 5.1 ISR (Incremental Static Regeneration)
DBアクセスの負荷を最小化するため、Next.jsのISRを徹底活用します。
- **Read:** ユーザーアクセス時は Vercel CDN (Edge) から静的HTMLを配信。DBアクセスは発生しない。
- **Revalidate:** DB更新時、対象記事のパスのみを On-demand Revalidation で再構築。

### 5.2 Search Optimization
JSONBへの検索クエリ負荷を避けるため、検索用カラムを分離します。
- **Storage:** 記事本文は `text/mdx` (Storage)。
- **Index:** 保存時、検索対象テキストを抽出して `tsvector`カラム (Full Text Search) および `vector` カラム (Semantic Search) に保存。
- **Query:** 検索時はインデックスのみを参照し、高速に応答する。

## 6. 多言語対応戦略 (Internationalization Strategy)

「世界最高峰のデータベース設計」として、**Normalized Translation Pattern (正規化された翻訳パターン)** を採用します。
「普遍的な事実（Universal Facts）」と「言語固有の表現（Localized Content）」をテーブルレベルで物理的に分離し、保守性と拡張性を最大化します。

### 6.1 アーキテクチャ原則
- **Separation of Concerns:** 
  - `articles` (Universal): スラッグ、公開設定、共通メタデータなど、言語に依存しない事実は1箇所で管理。
  - `article_translations` (Localized): タイトル、解説、要約など、言語ごとに変化する情報は翻訳テーブルで管理。
- **Scalability:** 言語数が増えてもカラム追加（`title_ja`, `title_en`...）は不要。レコード追加のみで対応可能。

### 6.2 Translation Table Pattern
すべての記事データに対して、対となる `_translations` テーブルを定義します。

- **Master Entity:** `id`, `slug` (Canonical), `universal_attributes`...
- **Translation Entity:** `article_id` (FK), `lang` (ISO code), `localized_attributes`...

これにより、「翻訳抜けの検知」や「AIへの特定言語のみの生成指示」がクエリレベルで極めて容易になります。

## 7. 検索仕様 (Tiered Hybrid Search Strategy)

「本文がDBにない」かつ「DB容量制限(500MB)」という条件下で、最高峰の検索体験を実現するための戦略。

### 7.1 Tier 1: Client-Side Full-Text Search (Top 1,000 Articles)
重要な人気記事に対しては、通信遅延ゼロの「爆速」検索を提供します。

- **Technology:** **Pagefind**
- **Mechanism:** ビルドされた静的HTML (SSG) からインデックスを生成し、ブラウザ上で検索を実行。
- **Scope:** プリビルドされる Top 1,000 記事の**全文**。
- **UX:** キーワード入力と同時に結果が表示される "Find-as-you-type" 体験。

### 7.2 Tier 2: Server-Side Semantic Search (Long-tail Articles)
ロングテール記事（全70,000件）に対しては、DBのメタデータと要約を用いた「概念検索」を提供します。

- **Technology:** **Supabase Database (PostgreSQL)**
- **Mechanism:**
  - **Keyword:** `pg_trgm` (Trigram) によるタイトル・作曲家名のあいまい検索。
  - **Semantic:** `pgvector` (**halfvec/16-bit**) による要約文の意味検索。
- **Scope:** 全記事のメタデータ、タグ、および **AI要約 (Summary)**。
- **UX:** 「悲しい雰囲気の曲」「バッハのバイオリン」といった自然言語クエリに対応。

### 7.3 Search UI Integration
ユーザーには裏側の仕組み（Pagefind vs DB）を意識させない統合UIを提供します。

1.  入力中は **Pagefind** が即座に候補を表示（Tier 1）。
2.  Enterキー押下、または「もっと見る」で **DB検索API** をコールし、全件から検索（Tier 2）。
3.  結果を統合して表示。

## 9. テーブル設計概要
詳細は `docs/05_design/data-schema.md` を参照してください。
- `articles`: 記事管理マスタ (Universal)
- `article_translations`: 記事翻訳・コンテンツ (Localized)
- `composers` / `works`: メタデータマスタ

## 8. Asset Delivery Strategy (Score SSG & R2)

「描画パフォーマンス」と「UX」を最大化するため、楽譜および画像アセットはサーバーサイドで事前に静的生成し、最適化された状態で配信します。

### 8.1 Server-Side Score Rendering (ABC & MusicXML)
Client-Side Rendering (`abcjs` on browser) の負荷とレイアウトシフト(CLS)を回避します。
また、**ABC記法**（AI生成用）だけでなく、**MusicXML形式**（既存リポジトリ抜粋用）もサポートし、世界最高品質の譜例を提供します。

- **Generation:** Admin UIでの保存時、フォーマットに応じて適切なエンジンを実行し、統一されたベクター画像 (**SVG**) を生成。
  - **ABC:** `abcjs`を使用。
  - **MusicXML:** **Verovio** を使用。学術レベルの高品質な浄書（Engraving）が可能。
- **Interactive Hydration:** 通常表示は軽量な `<img>` タグ。再生時のみ座標データ(JSON)をロードし、ハイライト表示等のインタラクションを実現する「Progressive Hydration」を採用。

### 8.2 Cloudflare R2 Integration
- **Storage:** 生成されたSVGおよびアップロードされた画像は **Cloudflare R2** に保存。
- **Delivery:** Vercel または Cloudflare CDN を通じてキャッシュ・配信。
### 8.3 Asset Reference Strategy
Supabase上の記事データとR2上のアセットは、**Asset ID (UUID)** によって疎結合にリンクさせます。
MDX（JSONB構造）の中に直接URLを書き込むのではなく、ID指定を行うことで、ドメイン変更やストレージ移行に強い設計とします。

- **Score Reference:**
  - JSONB Data: `{ "type": "score", "score_id": "uuid-1234", ... }`
  - Resolved URL: `https://assets.preludio.io/scores/{uuid-1234}.svg`
- **Image Reference:**
  - JSONB Data: `{ "type": "image", "image_id": "uuid-5678", ... }`
  - Resolved URL: `https://assets.preludio.io/images/{uuid-5678}.webp`

これにより、フロントエンドコンポーネント `<Score id="uuid" />` は、ビルド時または実行時にIDから正しいR2 URLを解決して表示します。

#### ID vs Title Strategy
- **ID (UUID):** システム内部の参照用。不変 (Immutable) であるため、ファイル名の変更やタイトルの修正を行ってもリンク切れが発生しません。
- **Title (Metadata):** 管理画面での表示および検索用（`music_scores` テーブルの `title` カラム）。人間にとっての意味（例: "Main Theme", "第1主題"）はここで管理します。
