# 検索・ディスカバリーシステム設計 (Search System)

## 1. 概要 (Overview)

本システムは、ユーザーが膨大な楽曲分析記事の中から「目的の記事」を素早く見つけ出し（Search）、あるいは「未知の興味深い記事」と出会う（Discovery）ための体験を提供します。
キーワード検索だけでなく、AIを活用したベクトル検索、および音楽的な文脈（調性、時代、楽器）に基づくフィルタリングを組み合わせた「ハイブリッド検索」を核とします。

## 2. 検索アルゴリズム (Search Logic)

### 2.1 スコアリング戦略 (Ranking Strategy)

ユーザー体験を最大化するため、単一の指標ではなく、以下の要素を組み合わせた**複合スコア (Composite Score)** を採用します。

$$
Score = (Vector \times W_v) + (Keyword \times W_k) + (Popularity \times W_p)
$$

| 要素                   | 役割             | 理由                                                                           |
| :--------------------- | :--------------- | :----------------------------------------------------------------------------- |
| **Vector Similarity**  | 意味的適合度     | ユーザーの「意図」を汲み取る。表記ゆれや類義語に対応。                         |
| **Keyword Match**      | 完全一致ボーナス | ユーザーが「特定の単語」を入力した場合、それが含まれる記事を確実に上位にする。 |
| **Popularity / Decay** | 品質・鮮度       | 「有名な曲」「新しい記事」など、一般的に需要が高いものを底上げする。           |

### 2.2 フェーズ別実装計画

#### Phase 1: シンプルなハイブリッド (MVP)

まずは「探してるものが出る」状態を作るため、ベクトル検索とキーワード検索の実装を優先します。

- **計算式:** `matchScore = (VectorScore * 0.7) + (KeywordScore * 0.3)`

#### Phase 2: ビジネスロジックの注入

データ蓄積後、「人気のある良質な記事」を優先表示するため、閲覧数などの係数を導入します。

- **計算式:** `BaseScore = (Vector + Keyword) ... FinalScore = BaseScore * log(ViewCount)`

### 2.3 API レスポンス

API（`ArticleSearchResultItemDto`）は**計算後の最終スコア (`matchScore`)** のみを返却します。フロントエンドはロジックを知る必要はなく、スコア順に表示するだけです。

## 3. ディスカバリーポータル (Discovery Experience)

能動的な検索だけでなく、受動的な「発見」を促すためのポータル画面（トップページ/検索ページ）のデザイン要件です。

### 3.1 検索ボックス (Search Box)

- **Placeholer:** "バッハ ピアノ曲", "悲しい短調の曲", "Sonata form" など、自然言語検索が可能であることを示唆。
- **Auto-suggest:** 入力中に候補（作曲家名、作品名）を即座に表示（Supabase `ilike` 検索等を利用）。

### 3.2 特集・キュレーション (Curated Collections)

- **"Editor's Pick":** 編集部おすすめの記事。
- **"Trend":** 現在注目されている記事（アクセス数ベース）。
- **"By Mood/Scenario":** 「朝に聴きたい」「集中したい時」など、状況に合わせた提案（AI生成タグを活用）。

### 3.3 フィルタリング UI (Faceted Search)

検索結果を以下の軸で絞り込むためのUIを提供します。

- **Composer:** 作曲家（Bach, Mozart, ...）
- **Instrument:** 楽器（Piano, Violin, Orchestra...）
- **Era:** 時代（Baroque, Classical, Romantic...）
- **Key:** 調性（C Major, etc.）
- **Difficulty:** 難易度（Beginner, Intermediate, Advanced）

## 4. インフラストラクチャ

- **Engine:** Supabase (`pgvector` + `pg_trgm`)
- **Indexing:** `embeddings` テーブルに HNSW インデックスを作成し、高速な近似近傍探索を実現。
- **Optimization:** Query Rewriting（ユーザー入力の正規化）や Caching（同一クエリのキャッシュ）をAPI層で実施。
