# Database-First Article Management Design

本ドキュメントは、**Supabase Database** を正本（Source of Truth）とし、AIエージェントによる効率的な制作・管理を行う「Database-First Article Application」の仕様を定義する。

## 1. 概要 (Architecture Overview)

**「管理は厳密に、配信は高速に、執筆は柔軟に」** を実現するため、以下の**Split-Storage Architecture**を採用する。

| Component | Technology | Role | Persistence |
| :--- | :--- | :--- | :--- |
| **Metadata** | **Supabase DB** | 検索インデックス、公開状態管理、リレーション | SQL (Relational) |
| **Body (Content)** | **Object Storage (R2)** | 記事本文（MDX）。可読性と移植性を重視 | File (MDX/Text) |
| **Delivery** | **CDN (Edge)** | 静的HTML配信 (SSG/ISR) | Cache |
| **Search** | **Pagefind / pgvector** | ハイブリッド検索（全文検索 + 意味検索） | Hybrid Index |

## 2. データ管理戦略 (Data Strategy)

### 2.1 Storage Key Strategy
- **Internal (Storage):** **UUID** を使用 (`article/{uuid}.mdx`)。不変性（Immutability）を担保し、リンク切れを防ぐ。
- **Public (URL):** **Slug** を使用 (`/works/bach/prelude`). SEOと可読性を優先。
  - *Mapping:* アプリケーション層で Slug -> UUID の解決を行う。

### 2.2 Metadata Strategy (Read-Optimized)
- **Source of Truth:** 正規化されたRDBMSテーブル (`composers` / `works`)。
- **Runtime Optimization:** 閲覧時のJOIN負荷をなくすため、記事レコード内に **`metadata` (JSONB)** カラムを持つ。
  - 必要な表示用データ（作曲家名、作品名など）は保存時にこのJSONBへスナップショットとして書き込む。
  - **Result:** **Zero-JOIN Rendering** を実現。

### 2.3 Integration with AI (Knowledge Glossaries)
AIエージェントの執筆精度を高めるため、以下のワークフローを採用する。
1.  **Export:** DB上のマスタデータを **Knowledge Manifest (Glossary JSON)** として定期出力。
2.  **Drafting:** エージェントはこのファイルを「辞書」として読み込み、表記揺れのないMDXを作成。
3.  **Validation:** 保存時にシステムが用語チェックを行う。

## 3. 信頼性と同期 (Reliability & Sync)

DBとStorage間の整合性を保つため、以下のルールを徹底する。

- **Transaction:** 「公開」操作は DB更新とStorageアップロードのアトミックな処理とする。
- **Sync Flag:** `article_translations` テーブルに **`storage_synced_at`** フラグを持つ。
  - これが `NULL` の記事は「同期未完了」とみなし、ビルドおよび公開APIから除外する（404回避）。
- **Idempotency:** 同期処理は冪等（何度実行しても同じ結果）に設計する。

## 4. 配信とパフォーマンス (Delivery & Performance)

### 4.1 Tiered Build Strategy (SSG/ISR)
Vercelのビルド制限(6,000分/月)を回避しつつ、高速化を図る。

| Tier | Target | Method | Description |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Top 1,000 Articles** | **SSG (Pre-build)** | ビルド時に静的生成。Pagefindインデックス対象。 |
| **Tier 2** | **Long-tail (70k+)** | **ISR (On-demand)** | 初回アクセス時に生成・キャッシュ。 |

### 4.2 Hybrid Search Strategy

| Type | Engine | Target | Description |
| :--- | :--- | :--- | :--- |
| **Fast Search** | **Pagefind** | Top 1,000 (SSG) | 通信不要のクライアントサイド検索。「Find-as-you-type」体験。 |
| **Deep Search** | **Supabase** | All Articles | `pg_trgm` (キーワード) + `pgvector` (意味検索) による全件検索。 |

### 4.3 Asset Delivery
- **Score (ABC/MusicXML):** 保存時にサーバーサイドで **SVG** に変換し、R2に配置（非同期バックグラウンド処理）。
- **Hydration:** 通常は `<img>` で表示し、再生時のみインタラクティブなプレイヤーコンポーネントにハイドレーションする。

## 5. 多言語対応 (Internationalization)
**Normalized Translation Pattern** を採用。

- `articles` (Universal): 言語共通のID、Slug管理。
- `article_translations` (Localized): 言語ごとのタイトル、本文(MDX path)、ステータス。
- **Slug:** 管理コスト低減のため **Universal Slug** (`/[lang]/works/[id]`) を採用。言語別Slugは実装しない。

詳細は `data-schema.md` を参照。
