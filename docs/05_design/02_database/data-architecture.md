# Database-First Article Management Design

本ドキュメントは、**Supabase Database** を正本（Source of Truth）とし、AIエージェントによる効率的な制作・管理を行う「Database-First Article Application」の仕様を定義する。

## 1. 概要 (Architecture Overview)

**「管理は厳密に、配信は高速に、執筆は柔軟に」** を実現するため、以下の**Split-Storage Architecture**を採用する。

**Constraints (設計制約):**

- **Supabase DB Size:** Free Tier (500MB) 制限。70,000記事の本文や検索用インデックスを全て格納することは不可。
- **Turso Capacity:** Free Tier (9GB) を確保。コンテンツ、翻訳、ベクトルデータを一括管理可能。
- **Build Time:** Vercel Build Timeoutの回避。全記事ビルドは不可。

| Component       | Technology           | Role                                    | Persistence / Policy              |
| :-------------- | :------------------- | :-------------------------------------- | :-------------------------------- |
| **Core & Auth** | **Supabase DB**      | ユーザー認証、基本プロファイル          | SQL / **500MB Limit**             |
| **Metadata**    | **Turso (libSQL)**   | 記事・作品・作曲家メタデータ、検索      | SQL / **9GB Limit**               |
| **Draft Body**  | **Supabase Storage** | 執筆中の本文 (MDX)                      | **Private Bucket (Auth/RLS)**     |
| **Public Body** | **Cloudflare R2**    | 公開済みの本文 (MDX)                    | **Public Bucket (CDN Cacheable)** |
| **Delivery**    | **CDN (Edge)**       | 静的HTML配信 (SSG/ISR)                  | Cache                             |
| **Search**      | **Pagefind / Turso** | ハイブリッド検索（全文検索 + 意味検索） | Hybrid Index                      |

## 2. データ管理戦略 (Data Strategy)

### 2.1 Identifier & Storage Key Strategy

- **Database (ID):** **36文字 (Hex) の UUID v7** を使用。
  - _Reason:_ SQLite上で `TEXT` 型として格納しても、辞書順（Lexicographical order）でソートするだけで「生成時間順」を維持でき、DB側のページネーションや最新順取得を高速化できるため。
- **Internal (Storage):** **URL Safe Base64 (from UUID v7)** を使用。
  - _Format:_ `article/{base64_id}.mdx` (e.g., `article/VQ6EANKb....mdx`)
  - _Reason:_ ソート順を必要とさないストレージ上のパスにおいて、UUID(36文字)をコンパクトな(22文字)に圧縮して可読性と効率を高めるため。
- **Public (URL):** **Slug** を使用 (`/works/bach/prelude`). SEOと可読性を優先。
  - _Mapping:_ アプリケーション層で Slug -> UUID -> Base64 の解決を行う。

### 2.2 Metadata Strategy (Read-Optimized)

- **Source of Truth:** 正規化されたRDBMSテーブル (`composers` / `works`)。
- **Runtime Optimization:** 閲覧時のJOIN負荷をなくすため、記事レコード内に **`metadata` (JSON)** カラムを持つ。
  - 必要な表示用データ（作曲家名、作品名など）は保存時にこのJSONへスナップショットとして書き込む。
  - **Result:** **Zero-JOIN Rendering** を実現。
- **Security:** TursoにはRLSがないため、アプリケーション層（Next.js）でアクセス制御を行う。

### 2.3 Integration with AI (Knowledge Glossaries)

AIエージェントの執筆精度を高めるため、**「DBマスタ」と「ファイル用語集」を統合**したManifestを利用する。

1.  **Source:**
    - **DB Entity (Large Scale):** Composers, Works (Tursoからエクスポート)。
    - **File Glossary (Static):** 音楽用語, 楽器, 時代区分 (Git管理下のJSON/TS)。
2.  **Export:** 上記をマージし、**Knowledge Manifest (JSON)** としてエージェントに提供。
3.  **Drafting & Validation:** エージェントはこれを参照して執筆し、保存時に用語チェックを行う。

## 3. 信頼性と同期 (Reliability & Sync)

DBとStorage間の整合性を保つため、以下のルールを徹底する。

- **Transaction:** 「公開」操作は DB更新とStorageアップロードのアトミックな処理とする。
- **Sync Flag:** `article_translations` テーブルに **`storage_synced_at`** フラグを持つ。
  - これが `NULL` の記事は「同期未完了」とみなし、ビルドおよび公開APIから除外する（404回避）。
- **Idempotency:** 同期処理は冪等（何度実行しても同じ結果）に設計する。

## 4. 配信とパフォーマンス (Delivery & Performance)

### 4.1 Tiered Delivery Strategy

コンテンツの性質（公開/非公開）とアクセス頻度に応じて、ビルドと配信経路を最適化する。

| Tier                   | Target        | Build Method | Body Source      | Delivery / Access                           |
| :--------------------- | :------------ | :----------- | :--------------- | :------------------------------------------ |
| **Tier 1 (Top)**       | Top 1,000     | SSG          | R2 (Public)      | CDN (Edge) / Public                         |
| **Tier 2 (Long)**      | 70k+ Articles | ISR          | R2 (Public)      | CDN (Edge) / Public                         |
| **Tier 3 (Protected)** | Paid Content  | **SSR**      | **R2 (Private)** | **Next.js Server (Gatekeeper) / Auth Req.** |

### 4.2 Self-Healing Mechanism (Availability)

データ整合性と可用性を維持するための自動修復プロセス。

- **Link Rot Switch:** 外部音源（YouTube等）のリンク切れを検知した場合、`is_default` フラグを同一 `Recording` 内の別ソース、または推奨される別の `Recording` へと自動的にフェイルオーバーさせる。
- **Default Guarantee:** 1つの `Score`（`playback_samples`）において、常に1つだけ `is_default: true` が存在することをQAエージェントが定期監視し、違反があれば修正する。

### 4.2 Hybrid Search Strategy

| Type            | Engine       | Target          | Description                                                       |
| :-------------- | :----------- | :-------------- | :---------------------------------------------------------------- |
| **Fast Search** | **Pagefind** | Top 1,000 (SSG) | 通信不要のクライアントサイド検索。「Find-as-you-type」体験。      |
| **Deep Search** | **Turso**    | All Articles    | `FTS5` (キーワード) + `libsql-vector` (意味検索) による全件検索。 |

### 4.3 Asset Delivery

- **Score (ABC/MusicXML):** 保存時にサーバーサイドで **SVG** に変換し、R2に配置（非同期バックグラウンド処理）。
  - **Technology:** **Verovio (MusicXML)** for Professional Engraving, **abcjs (ABC)** for Lightweight Rendering.
- **Hydration:** 通常は `<img>` で表示し、再生時のみインタラクティブなプレイヤーコンポーネントにハイドレーションする。

## 5. 多言語対応 (Internationalization)

データの性質とアクセス頻度に応じ、 **Hybrid Strategy** を採用する。

### 5.1 Translation Table Pattern (for Primary Entities)

- **Target:** `Articles`, `Works`, `Composers`, `Tags`
- **Rationale:** アプリケーションの主役（Primary Entity）。「日本語の記事一覧」のように**言語によるフィルタリング（WHERE句）**が頻繁に発生するため、正規化された別テーブルで管理する。

### 5.2 JSONB Attribute Pattern (for Subordinate Attributes)

- **Target:** `MediaAssets` (`alt_text`), `UI Config`
- **Rationale:** 親データに従属する脇役（Attribute）。ID指定でFetchされることが多く、都度 `JOIN` するコストを避けるため、親レコード内のJSONB (`{ "ja": "...", "en": "..." }`) で完結させる。

詳細は `database-schema.md` を参照。
