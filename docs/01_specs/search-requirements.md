# ユーザー検索ニーズ定義 (Search Requirements)

本ドキュメントでは、ユーザーの検索意図（Search Intent）を明確化し、それを実現するためのデータベース実装戦略（カラム vs JSONB）を定義します。
この要件定義は `database-schema.md` の物理設計の根拠となります。

## 1. Search Needs Matrix (検索ニーズ優先度)

ビジネス要件（10,000記事、SEO、回遊率）に基づき、以下の優先順位で最適化を行います。

## 1. Search Needs Clusters (検索ニーズの優先順位)

ビジネス要件（10,000記事運用、SEO集客、サイト回遊）に基づき、以下の4クラスターに優先順位を設定します。

### 1位：超有名曲・通称 (Famous Works & Nicknames)
**[SEO / 最優先]**
*   **Target:** `nicknames` (JSONB)
*   **Use Case:** 「運命」「月の光」などのビッグワード、および「運命 聴きどころ」「月の光 難易度」などのロングテール。
*   **Why:** 検索ボリュームが最大。最も明確な動機。
*   **DB Strategy:** `work_translations` および `article_translations` に `nicknames` (JSONB/Array) を保持し、検索ヒット率を高める。

### 2位：作曲家名 (Composers)
**[Trust / 回遊]**
*   **Target:** `composers` (Normalized)
*   **Use Case:** 特定の作曲家を掘り下げる。「バッハ」「ショパン」。
*   **Why:** 滞在時間が長く、サイトの専門性(E-E-A-T)を高める「ハブ」となる。共通言語としての固有名詞。
*   **DB Strategy:** `composers` テーブルの正規化と、記事からの効率的なリンク。

### 3位：シチュエーション・効能 (Situation & Mood)
**[Differentiation / Affiliate]**
*   **Target:** `tags` (Taxonomy)
*   **Use Case:** 「泣ける」「集中できる」「朝に聴きたい」。
*   **Why:** 競合(IMSLP等)が手薄な領域。アフィリエイト（Amazon Music等）への導線として親和性が高い。
*   **DB Strategy:** AI自動生成によるタグ付け (`metadata -> tags`)。

### 4位：楽器・編成 × 楽曲形式 (Instrument & Context)
**[Filtering / 補助]**
*   **Target:** `instrumentation`, `genre`
*   **Use Case:** 「ピアノ曲の中で泣ける曲」。
*   **Why:** 単体検索よりは、絞り込み（ドリルダウン）機能として重要。
*   **DB Strategy:** フィルタリング用カラム (`sl_instrumentation`) の用意。

---

## 2. Implementation Strategy (実装戦略)

「読み取りアクセス（検索・一覧表示）の頻度が、書き込み（更新）の頻度よりも圧倒的に高い」という特性に基づき、**Read-Optimized (Zero-JOIN)** 戦略を採用します。

### Zero-JOIN Strategy
検索頻度の高い属性（High/Mediumの一部）は、正規化されたマスタテーブルから参照するのではなく、**検索対象となる `Articles` テーブル自体に直接カラムとして持ちます（非正規化）。**

| Cluster (Priority) | Need | Key | DB Implementation Strategy |
| :--- | :--- | :--- | :--- |
| **1 (Top)** | **Works / Nicknames** | Title, Nicknames | **`article_translations.display_title`**<br>**`article_translations.nicknames` (JSONB/Array)** |
| **1 (Top)** | **Composer** | Name | **`article_translations.composer_name`** |
| **2 (High)** | **Attributes** | Catalogue, Key | `article_translations.catalogue_id` |
| **3 (Mid)** | **Mood / Situation** | Tags | **`article_translations.metadata -> tags` (GIN Index)** |
| **4 (Low)** | **Instrument** | Instrumentation | `article_translations.instrumentation` |

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
*   Geminiによる自動生成とDBへの流し込み。

### Phase 3: Advanced Filtering (高度化)
**Focus:** Priority 4 (Filtering)
*   `Instrumentation`: 楽器構成の詳細化（ソロ、デュオ、カルテット等）。

