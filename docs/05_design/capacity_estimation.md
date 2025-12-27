# Capacity Estimation & Storage Strategy for 70,000 Articles

## 1. 前提条件とコンテンツモデル (Assumptions)

「世界最高のクラシック音楽サイト」を目指すための、妥協のない高品質コンテンツを想定します。

- **記事数:** 70,000 (10,000 Works x 7 Languages)
- **読了時間:** 5分程度 (読み応えのある専門的解説)
- **文字数:** 4,000文字 (日本語換算)
- **譜例数:** 5つ (4-6小節のABC記法)

## 2. 1記事あたりの容量試算 (Per Article Estimation)

| 項目 (Item) | 想定サイズ | 備考 |
| :--- | :--- | :--- |
| **Metadata** (Slug, IDs) | 0.2 KB | UUID, Index |
| **Summary** (300 chars) | 1.0 KB | 検索結果用要約 |
| **Music Scores** (ABC x 5) | 0.5 KB | ABC記法は非常に軽量 (100bytes x 5) |
| **Vectors** (Summary Only) | 3.0 KB | 768次元 float32 (検索用) |
| **Content Body** (Long Text) | **12.0 KB** | 4,000文字 * 3bytes (UTF-8) |
| **JSON Overhead** | 1.0 KB | 構造化タグ等 |
| **Total Size** | **17.7 KB** | |

## 3. 総容量とFree Tier判定 (Total vs Limit)

### 70,000記事の総容量
$$ 17.7 \text{ KB} \times 70,000 = 1,239,000 \text{ KB} \approx \mathbf{1.24 \text{ GB}} $$

### Supabase Free Tier Limit Check
- **Database Limit:** **500 MB**
- **Result:** **判定: 容量超過 (Over Limit)**
  - 全てをDB (`jsonb`) に格納すると、無料枠を **2.5倍** 超過します。
  - インデックス作成によるオーバーヘッドを含めるとさらに逼迫します。

---

## 4. 対策: Split-Storage Strategy (Zero Cost Architecture)

「DB管理の利便性」と「容量制限」を両立させるため、**「検索に必要なデータはDB、重い本文はObject Storage」** に物理配置を分割します。

### 4.1 データ配置プラン

| データ区分 | 保存先 | 容量見積もり (70k) | 判定 |
| :--- | :--- | :--- | :--- |
| **Index Data**<br>(Meta, Summary, Scores, Vectors) | **Supabase DB** | 4.7 KB x 70k = **329 MB** | ✅ **Safe** (< 500 MB) |
| **Body Data**<br>(Main Content Text) | **Cloudflare R2** | 13.0 KB x 70k = **910 MB** | ✅ **Safe** (< 10 GB) |

### 4.2 Application Architecture
Admin UIおよびアプリケーションからは、この分割を意識させない設計とします。

1.  **Read:** `articles` テーブルと一緒に、透過的に Storage から本文JSONを取得 (または遅延ロード)。
2.  **Write:** Admin UI保存時に、トランザクション内で「DBメタデータ更新」と「Storage JSONアップロード」を同時に実行。
3.  **Search:** 検索はDB内の `Summary` および `Tags` に対して行う（本文全文検索はコスト的に諦めるか、Pagefind等のクライアント検索に委譲）。

### 5. 結論
世界最高品質のコンテンツ(1.2GB)を維持しつつZero Costを守るためには、**本文(Body)の外部化が必須**です。
しかし、**楽譜データ(Scores)** は軽量(0.5KB)であるため、**DB内に格納して問題ありません。** これにより、「楽譜の内容による検索（メロディ検索など）」の可能性を残せます。
