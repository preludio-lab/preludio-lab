# ユーザー検索ニーズ定義 (Search Requirements)

本ドキュメントでは、ユーザーの検索意図（Search Intent）を明確化し、それを実現するためのデータベース実装戦略（カラム vs JSONB）を定義します。
この要件定義は `database-schema.md` の物理設計の根拠となります。

## 1. Search Needs Matrix (検索ニーズ優先度)

ビジネス要件（10,000記事、SEO、回遊率）に基づき、以下の優先順位で最適化を行います。

## 1. Search Needs Clusters (検索ニーズの優先順位)

ビジネス要件（10,000記事運用、SEO集客、サイト回遊）に基づき、以下の4クラスターに優先順位を設定します。

### 1位：超有名曲・通称 (Famous Works & Nicknames)
**[SEO / 最優先]**
*   **Use Case:** 「運命」「月の光」などのビッグワード、および「運命 聴きどころ」「月の光 難易度」などのロングテール。
*   **Why:** 検索ボリュームが最大。最も明確な動機。

### 2位：作曲家名 (Composers)
**[Trust / 回遊]**
*   **Use Case:** 特定の作曲家を掘り下げる。「バッハ」「ショパン」。
*   **Why:** 滞在時間が長く、サイトの専門性(E-E-A-T)を高める「ハブ」となる。共通言語としての固有名詞。

### 3位：シチュエーション・効能 (Situation & Mood)
**[Differentiation / Affiliate]**
*   **Use Case:** 「泣ける」「集中できる」「朝に聴きたい」。
*   **Why:** 競合(IMSLP等)が手薄な領域。アフィリエイト（Amazon Music等）への導線として親和性が高い。

### 4位：楽器・編成 × 楽曲形式 (Instrument & Context)
**[Filtering / 補助]**
*   **Use Case:** 「ピアノ曲の中で泣ける曲」。
*   **Why:** 単体検索よりは、絞り込み（ドリルダウン）機能として重要。

---

## 2. Implementation Strategy (実装戦略)

「読み取りアクセス（検索・一覧表示）の頻度が、書き込み（更新）の頻度よりも圧倒的に高い」という特性に基づき、**Read-Optimized** 戦略を採用します。
※ 具体的な物理設計（Zero-JOIN、カラム定義など）は `docs/05_design/database-schema.md` で定義します。

| Cluster (Priority) | Need | Key Attributes |
| :--- | :--- | :--- |
| **1 (Top)** | **Works / Nicknames** | Title, Nicknames (通称) |
| **1 (Top)** | **Composer** | Name |
| **2 (High)** | **Attributes** | Catalogue ID, Key |
| **3 (Mid)** | **Mood / Situation** | Tags (Mood, Situation, Terminology) |
| **4 (Low)** | **Instrument** | Instrumentation, Genre |

---

## 3. Data Design Roadmap (メタデータ構築ロードマップ)

1万記事の運用効率を最大化するため、以下のフェーズでデータを構築します。

### Phase 1: Foundation (土台構築)
**Focus:** Priority 1 & 2 (SEO & Trust)
マスタデータの整備と、正規化されたテーブル構造の確立。
*   `Composers`: 氏名、生没年、国籍
*   `Works`: 正式名称、**通称 (Nicknames)**、作品番号

### Phase 2: Context (文脈付与)
**Focus:** Priority 3 (Differentiation)
AIエージェントを活用したメタデータの拡充。
*   `Tags`: ムード（泣ける）、シーン（作業用）、専門用語のタグ付け。

### Phase 3: Advanced Filtering (高度化)
**Focus:** Priority 4 (Filtering)
*   `Instrumentation`: 楽器構成の詳細化（ソロ、デュオ、カルテット等）。

---

## 4. Reference: Global Search Trends (グローバル検索調査)

### 4.1 Global Search Priorities (英語圏・欧州・アジア)
グローバル市場では、通称よりも「カタログ番号」「楽器」「機能性」の検索重要度が高まります。

*   **Catalog Number:** 「Beethoven Symphony 5」や「Op. 67」が検索の絶対正解。
*   **Instrument:** 「Best Piano Solos」など、楽器起点の検索が強力。
*   **Functionality:** 「Focus」「Sleep」「Meditation」など、ツールとしての消費ニーズが巨大。

### 4.2 Global Search Keywords Top 100 Clusters

#### ① Composers (High Volume)
Bach, Chopin, Mozart, Beethoven, Debussy, Tchaikovsky, Vivaldi, Rachmaninoff, Liszt, Satie.

#### ② Masterpieces & Nicknames (Global Standards)
| Rank | English Search Term | Original / Catalog |
| :--- | :--- | :--- |
| 1 | **Canon in D** | Pachelbel |
| 2 | **Clair de Lune** | Debussy (Suite bergamasque) |
| 3 | **Moonlight Sonata** | Beethoven (Op. 27 No. 2) |
| 4 | **The Four Seasons** | Vivaldi (Le quattro stagioni) |
| 5 | **Nocturne Op. 9 No. 2** | Chopin |
| 6 | **Gymnopédie No. 1** | Erik Satie |
| 7 | **Symphony No. 5** | Beethoven |
| 8 | **Rhapsody in Blue** | Gershwin |
| 9 | **Bolero** | Ravel |
| 10 | **Swan Lake** | Tchaikovsky |

#### ③ Context & Utility (High Conversion)
*   **Study:** Deep focus, Concentration, Baroque for study.
*   **Mood:** Sad, Epic, Romantic, Dark, Peaceful.
*   **Difficulty:** Hardest piano pieces, Grades (ABRSM).
*   **Era:** Baroque, Classical, Romantic, Impressionism.

