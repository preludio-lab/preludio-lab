# ADR: Database Technology Selection (Supabase vs Turso vs D1)

*   **Status:** Accepted
*   **Date:** 2025-12-31
*   **Author:** AI Agent (Antigravity)
*   **Tags:** #database, #infrastructure, #cost, #security

## Context (背景)

「世界最高のクラシック音楽サイト」を目指す PreludioLab において、70,000記事（7言語）規模のデータセットを扱うためのデータベース基盤を選定する必要がある。
初期フェーズにおいては可能な限りランニングコストを抑える「Zero-Cost Architecture」が望ましいが、以下の重要な非機能要件が存在する。

1.  **Security (RLS):** 編集権限の管理や、ユーザーごとのデータ分離（Multi-tenancy）をアプリケーション層ではなくインフラ層で強固に保証したい。
2.  **Vector Search:** UXの中核となる「感情検索（Emotional Discovery）」を実現するため、ベクトル検索機能が必須である。
3.  **Capacity:** 7言語展開時、データ総量は約1GBに達する見込みである。

候補として、以下の3つのソリューションが挙がっている。
*   **Supabase:** PostgreSQLベース。機能豊富だが無料枠500MB。
*   **Turso:** SQLiteベース。無料枠9GBと大きいが、周辺機能が発展途上。
*   **Cloudflare D1:** SQLiteベース。Egress無料だが、Vector機能が分離している。

## Decision (決定)

**Supabase Pro をコアDBとし、Cloudflare R2 をストレージとして併用する「ハイブリッド構成」を採用する。**

### 構成詳細
1.  **Core Database: Supabase (PostgreSQL)**
    *   **Tier:** 初期はFree Tier (JA/EN限定)、規模拡大に伴い Pro Tier ($25/mo) へ移行。
    *   **役割:** 記事メタデータ、ユーザー認証、権限管理 (RLS)、ベクトル検索 (`pgvector`)。
2.  **Asset Storage: Cloudflare R2**
    *   **役割:** 画像、音声、MDX本文データ。
    *   **理由:** 転送量（Egress）無料の恩恵を最大化し、メディア配信コストをゼロに抑えるため。

## Consequences (結果)

### Positive (メリット)
*   **Robust Security:** Row Level Security (RLS) により、アプリケーションコードのバグによる情報漏洩リスクを最小化できる。
*   **feature Maturity:** `pgvector` はエコシステムが成熟しており、日本語全文検索 (`pg_trgm`) との併用（Hybrid Search）も容易である。
*   **Dev Productivity:** 認証、DB、Edge Functionsが統合されており、開発工数を大幅に削減できる。人件費換算でのコストパフォーマンスは最高となる。

### Negative (デメリット)
*   **Cost:** 将来的に月額$25の固定費が発生する（Turso/D1なら無料の可能性がある）。
*   **Migration Risk:** SQLite (Turso/D1) への移行はスキーマ互換性の観点から容易ではないため、Vendor Lock-in の側面はある。

### Comparison Matrix (比較検討)

| 評価項目 | **Supabase** (Selected) | **Turso** | **Cloudflare D1** |
| :--- | :--- | :--- | :--- |
| **無料枠容量** | 500 MB | 9 GB | 5 GB |
| **ベクトル検索** | **`pgvector`** (Native & Mature) | `libsql-vector` (Beta) | `Vectorize` (Separate DB) |
| **セキュリティ** | **RLS (Native)** | App Logic Required | App Logic Required |
| **結論** | **採用** (機能・品質重視) | 不採用 (セキュリティリスク) | 不採用 (開発複雑性) |
