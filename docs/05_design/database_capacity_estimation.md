# データベース容量試算 (Database Capacity Estimation) v4.0

**目的:** 70,000記事 × **7言語** (JA, EN, DE, FR, IT, ES, ZH) = 490,000エントリー を「Polyglot Architecture」で完全無料収容する。

## 1. 結論: Zero-Cost 達成 (Turso 9GB 利用)
Supabase単体では不可能だった7言語のデータ量（約1GB）を、**Content Warehouse (Turso)** にオフロードすることで、全てのサービスで無料枠内での運用が可能となる。

| サービス | 格納データ | 推定容量 | 無料枠上限 | 判定 |
| :--- | :--- | :--- | :--- | :--- |
| **Supabase** | User Auth, Profiles | < 50 MB | 500 MB | ✅ **Safe** (10%) |
| **Turso** | Articles, Translations, Vectors | **~ 1.1 GB** | **9.0 GB** | ✅ **Safe** (12%) |
| **Cloudflare** | Images, Audio (R2) | - | Egress $0 | ✅ **Safe** |

---

## 2. 詳細内訳 (Turso Side)

### 2.1 テキストデータ & インデックス
Turso (SQLite) は圧縮効率が高いため、Postgres試算と同等かそれ以下に収まる。

| 項目 | 件数 | 単価 | 合計 |
| :--- | :--- | :--- | :--- |
| **Translation Rows** | 490k | 1.0 KB | **490 MB** |
| **Indexes (B-Tree)** | 490k | 0.4 KB | **196 MB** |

### 2.2 ベクトルデータ (Full 7 Languages)
9GBの余裕があるため、**全7言語のベクトル化**が可能になる。
(Supabase案ではJAのみという妥協が必要だったが、Turso案なら妥協不要。)

| 項目 | 件数 | 単価 | 合計 | 戦略 |
| :--- | :--- | :--- | :--- | :--- |
| **Vectors (7 Langs)** | **490k** | 0.8 KB | **392 MB** | 768次元 Float32 |
| **Vector Index** | - | - | **(incl)** | LibSQL Native |

### 2.3 合計容量 (Turso)
**推定合計: 約 1.08 GB**
-> Turso無料枠 (9GB) の **約12%** しか消費しない。
-> 将来的に記事数が10倍（70万記事）になっても無料枠内で耐えられるスケーラビリティを持つ。

## 3. アクションプラン
1.  **Schema Adaptation:** `database-schema.md` の設計を、実装時に SQLite (Turso) 用の型やインデックス定義に変換する（Prisma/Drizzle等を利用）。
2.  **App-Layer RLS:** Next.js側での権限チェック実装を徹底する。

### 今後のアクションプラン
1.  **監視 (Monitoring):** 運用開始後、ダッシュボードで容量推移を週次監視する。
2.  **アーカイブ (Archiving):** 450MBを超えた時点で、アクセス頻度の低い「ドラフト記事」や「古いバージョン」を削除、またはCold Storage (R2) へ退避する機能を実装する。
3.  **Pro Tier移行:** 収益化の目処が立った段階で、月額$25のPro Tierへ移行する（容量8GB）。これが最も健全な長期的解決策である。

**目的:** 70,000記事を **Supabase Free Tier (500 MB)** 内に収容可能か検証する。

## 1. 結論: 500MB制限への対策
7万記事を500MBで管理するためには、以下の戦略が **必須** である。

1.  **Split-Storage:** 記事本文 (MDX) はデータベースに入れず、Object Storage (R2) へ逃がす。
2.  **Half-Precision:** ベクトル検索には軽量な `halfvec` (16-bit) を使用する（Float32は容量オーバー）。
3.  **Summary Only:** 全文検索対象は「要約」に絞る（本文全文のインデックス化は不可）。

**結果:** 推定合計サイズ = **約 370 MB** (✅ 安全圏)

---

## 2. 詳細内訳

### 2.1 テーブルデータ (行データ)
MDX本文は除外。メタデータ、楽譜、要約のみをDBに格納する。

| 項目 | 1行あたり | 70k件合計 | 備考 |
| :--- | :--- | :--- | :--- |
| **Metadata** | 0.2 KB | 14 MB | ID(UUID), Slug, Title 等 |
| **Summary** | 1.0 KB | 70 MB | 一覧表示および検索用 |
| **Scores** | 0.5 KB | 35 MB | ABC/MusicXML (テキストデータ) |
| **Content Body** | - | **0 MB** | **R2へオフロード** |
| **Table Total** | | **119 MB** | |

### 2.2 Vector Embeddings (ベクトルデータ)
標準の `float32` では容量不足となるため、`halfvec` を採用する。

| 型 | データサイズ | データ合計 | インデックス (HNSW) | 合計インパクト |
| :--- | :--- | :--- | :--- | :--- |
| **Float32** | 3 KB | 210 MB | ~210 MB | **420 MB** (❌ 不可) |
| **Halfvec** | 1.5 KB | **105 MB** | **~100 MB** | **205 MB** (✅ 可能) |

### 2.3 合計容量
| カテゴリ | サイズ |
| :--- | :--- |
| **テーブルデータ** | 119 MB |
| **標準インデックス** (B-Tree/GIN) | 45 MB |
| **ベクトルデータ + インデックス** (`halfvec`) | 205 MB |
| **総合計** | **369 MB** |

## 3. ID戦略 (UUID v7 & Base64)
**決定: UUID v7 を採用する。**

- **容量差:** Integer比でわずか **~0.8 MB** (0.16%) の増加であり、無視できる。
- **メリット:**
  - **v7 (Time-ordered):** 時系列ソートが可能で、インデックス効率が良い（ランダムUUIDの欠点を解消）。
  - **Base64:** ストレージキーとして使う際、Base64エンコードでcompactに扱える。
