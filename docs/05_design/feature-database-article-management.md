# データベース記事管理システム設計書 (feature-database-article-management.md)

## 1. 概要
本ドキュメントは、**Supabase Database** をコンテンツの正本（Source of Truth）とし、AIエージェントによる効率的な制作・管理を行う「Database-First Content Application」の仕様を定義します。
Gitは、DBデータの「バックアップ」および「静的サイト生成(SSG)ソース」として位置付けます。

## 2. 前提条件と制約 (Constraints)
- **Supabase Database:** 500MB Free Limit (Master).
- **GitHub:** Output Target for Backup & Build.
- **Scale:** 70,000 Articles (Granular Sections).

## 3. Database-First Configuration

### 3.1 Data Source Roles & Persistence Matrix (Split-Storage)

**容量見積もり (1.2GB) に基づき、本文のみ外部Storageへ分離します。**
詳細は `docs/05_design/database_capacity_estimation.md` を参照してください。
ただし、アプリケーション(Admin)からは透過的に扱います。

| 管理対象 | Master Source | Physical Location | Note |
| :--- | :---: | :--- | :--- |
| **Metadata** | **RDBMS** | `works`, `translations` tables | Searchable, Fast |
| **Scores (ABC)** | **RDBMS** | `translations` (JSONB) | Lightweight (0.5KB), Searchable |
| **Summary** | **RDBMS** | `translations` (JSONB) | For Search & List View |
| **Content Body (Draft)** | **Supabase Storage** | **Private Bucket**. Auth/RLSで保護。 |
| **Content Body (Public)** | **Cloudflare R2** | **Public Bucket**. 10GB Free. 900MBのデータも余裕。 |

- **Supabase Database (Master Index):**
  - メタデータ、楽譜データ、要約を保持 (Total ~330MB < 500MB).
- **Supabase Storage (Draft Store):**
  - 執筆中のドラフトデータを一時保存。Authとの連携を重視。
- **Cloudflare R2 (Public Body Store):**
  - **公開後の本文JSONの正本。**
  - Supabaseの1GB制限 (900MB利用でほぼ満杯) を回避するため、10GB無料のR2を採用。
- **GitHub (Code Repository):**
  - **Application Code Only.**
  - 70,000記事のMDXファイルは **Git管理しません** (Repo肥大化防止のため)。
  - ビルド時 (`generateStaticParams`) に Supabase から直接データを取得してページを生成します。

### 3.2 Workflow: Direct DB Build Flow
1.  **Edit:** 人間/AIがAdmin UIでDBを更新。
2.  **Publish:** ステータスを公開に変更。
3.  **Revalidate:** On-demand ISR APIを叩き、Next.jsキャッシュを更新 (+ Pagefind Index更新)。

### 3.3 Editor Stack (Admin UI)
- **Framework:** Next.js (App Router)
- **Editor:** Tiptap / Lexical
- **AI Integration:** Vercel AI SDK (Streaming edits).

## 4. データ構造戦略 (JSONB Hybrid Model)

「AIエージェントによる編集のしやすさ」と「配信パフォーマンス」を両立させるため、**PostgreSQL JSONB** を活用したハイブリッド構造を採用します。

- **Normalized Tables:** `articles`, `works` 等の親エンティティ、および `translations` テーブル自体は正規化して管理。
- **JSONB Content:** コンテンツのセクション構造（段落、楽譜、見出し）は、`translations` テーブル内の **`content_structure` (JSONB)** カラムに格納します。

### Merits
- **No JOINs:** 1レコード取得するだけで、その言語の記事構成要素が全て手に入る。
- **Flexibility:** 「ここはテキスト」「次は楽譜」といった構造を配列順序として直感的に管理できる。
- **AI-Friendly:** AIに対する「特定のセクションID (`intro`) のみを書き換えよ」という指示が容易。

### 4.1 Storage Key Strategy (UUID vs Slug)
Object Storage上のJSONファイル名は、Slugではなく **UUID (Record ID) を使用します。**

- **Format:** `content/{uuid}.json` (e.g. `content/550e8400-e29b-41d4-a716-446655440000.json`)
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
- **Storage:** コンテンツは `jsonb` カラム。
- **Index:** 保存時、検索対象テキストを抽出して `tsvector`カラム (Full Text Search) および `vector` カラム (Semantic Search) に保存。
- **Query:** 検索時はインデックスのみを参照し、高速に応答する。

## 6. 多言語対応戦略 (Internationalization Strategy)

「世界最高峰のデータベース設計」として、**Normalized Translation Pattern (正規化された翻訳パターン)** を採用します。
「普遍的な事実（Universal Facts）」と「言語固有の表現（Localized Content）」をテーブルレベルで物理的に分離し、保守性と拡張性を最大化します。

### 5.1 アーキテクチャ原則
- **Separation of Concerns:** 
  - `works` (Universal): 作曲年、作品番号、調性など、言語に依存しない事実は1箇所で管理。
  - `work_translations` (Localized): タイトル、解説、要約など、言語ごとに変化する情報は翻訳テーブルで管理。
- **Scalability:** 言語数が増えてもカラム追加（`title_ja`, `title_en`...）は不要。レコード追加のみで対応可能。

### 5.2 Translation Table Pattern
すべてのマスタデータおよびコンテンツデータに対して、対となる `_translations` テーブルを定義します。

- **Master Entity:** `id`, `slug` (Canonical), `universal_attributes`...
- **Translation Entity:** `entity_id` (FK), `lang` (ISO code), `localized_attributes`...

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

## 6. テーブル設計概要
詳細は `docs/05_design/data-schema.md` を参照してください。
- `composers`: 作曲家メタデータ
- `works`: 楽曲・譜例メタデータ
- `content_embeddings`: 検索用ベクトルデータ

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
Supabase上のコンテンツとR2上のアセットは、**Asset ID (UUID)** によって疎結合にリンクさせます。
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
