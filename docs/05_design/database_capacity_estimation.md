# Database Capacity Estimation & Storage Strategy

## 1. 前提条件 (Assumptions)
- **記事数:** 70,000
- **DB Limit:** 500 MB (Supabase Free Tier)

## 2. インデックスの基礎知識 (Technical Context)
DB容量は「データそのもの(Table)」と「検索用索引(Index)」の合計になります。

| Index Type | 用途 | 容量目安 (vs データ) |
| :--- | :--- | :--- |
| **B-Tree** | ID, Slug, Foreign Key | **~20%** (軽量) |
| **GIN** | 全文検索 (Tag, Summary) | **~60-100%** (中量。単語数に比例) |
| **HNSW** | ベクトル検索 (Semantic) | **~80-100%** (重量。高速化のためグラフ構造を持つ) |

## 3. 詳細容量見積もり (Detailed Calculation)

### 3.1 Raw Data Size (Table)
| 項目 | 単価 | 70k件合計 | 備考 |
| :--- | :--- | :--- | :--- |
| Metadata (ID, Slug) | 0.2 KB | **14 MB** | |
| Summary (Text) | 1.0 KB | **70 MB** | |
| Music Scores (Text) | 0.5 KB | **35 MB** | |
| **Content Body (MDX)** | - | **0 MB** | **Split-Storage (R2へ除外)** |
| **Table Total** | | **119 MB** | |

### 3.2 Index Size (Overhead)
普通に実装すると、Vectorのインデックスでパンクします。

| Index | 対象 | 試算 | 判定 |
| :--- | :--- | :--- | :--- |
| **PK/FK Indexes** | ID, Slug | 14 MB * 20% = **3 MB** | 誤差レベル |
| **Search Index** | Summary (GIN) | 70 MB * 60% = **42 MB** | 許容範囲 |
| **Vector Data** | `vector(768)` | 3 KB * 70k = **210 MB** | **巨大** (Float32) |
| **Vector Index** | HNSW | 210 MB * 100% = **210 MB** | **巨大** |
| **Grand Total** | (Table + Index) | 119 + 3 + 42 + 420 = **584 MB** | ❌ **OUT (>500MB)** |

---

## 4. 解決策: Half-Precision Vectors (`halfvec`)

pgvector 0.5.0+ でサポートされた **16-bit浮動小数点 (`halfvec`)** を採用します。
精度への影響は軽微ですが、容量は **半分** になります。

| 項目 | Float32 (通常) | **Halfvec (16-bit)** |
| :--- | :--- | :--- |
| **Vector Data** | 210 MB | **105 MB** |
| **Vector Index** | 210 MB | **100 MB** (approx) |
| **New Total** | 584 MB | **369 MB** |

### 最終判定 (Final Verdict)
$$ \mathbf{369 \text{ MB}} < 500 \text{ MB} \rightarrow \text{ ✅ \textbf{SAFE}} $$

`halfvec` を採用することで、インデックスを含めても無料枠内に収めることが可能です。
