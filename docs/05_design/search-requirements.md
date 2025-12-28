# ユーザー検索ニーズ定義 (Search Requirements)

本ドキュメントでは、ユーザーの検索意図（Search Intent）を明確化し、それを実現するためのデータベース実装戦略（カラム vs JSONB）を定義します。
この要件定義は `database-schema.md` の物理設計の根拠となります。

## 1. Search Needs Matrix (検索ニーズ優先度)

ビジネス要件（10,000記事、SEO、回遊率）に基づき、以下の優先順位で最適化を行います。

### Priority: High (SEO / 新規流入 / 玄関口)
Google等の検索エンジンからの流入や、明確な目的を持った検索に対応する必要不可欠な機能。

| Need | Use Case | Query Example |
| :--- | :--- | :--- |
| **基本属性** | 曲名、作曲家名、作品番号での直接検索 | "ベートーヴェン 運命", "BWV 846" |
| **ジャンル・楽器** | 交響曲、ピアノ、オペラなど大枠での探索 | "ピアノソナタ", "交響曲 名曲" |
| **Curation** | 初心者向け、おすすめ、定番リスト | "クラシック 初心者 おすすめ" |

### Priority: Medium (UX / 没入感 / 回遊)
サイト内での回遊時間を延ばし、ユーザーの「感性」に訴求する機能。AIによるタグ付けを活用。

| Need | Use Case | Query Example |
| :--- | :--- | :--- |
| **Mood/Situation** | 気分やシチュエーションでの探索 | "泣けるクラシック", "朝に聴きたい曲" |
| **Era/Region** | 時代や地域に基づく文脈的な探索 | "バロック音楽", "ロシアの作曲家" |

### Priority: Low (Expert / 詳細 / 研究)
専門的なニーズ。一部の熟練者向けであり、初期フェーズでは優先度を下げる。

| Need | Use Case | Query Example |
| :--- | :--- | :--- |
| **Score/Theory** | 譜例の有無、楽曲構造、調性 | "ハ短調", "ソナタ形式", "楽譜あり" |

---

## 2. Implementation Strategy (実装戦略)

「読み取りアクセス（検索・一覧表示）の頻度が、書き込み（更新）の頻度よりも圧倒的に高い」という特性に基づき、**Read-Optimized (Zero-JOIN)** 戦略を採用します。

### Zero-JOIN Strategy
検索頻度の高い属性（High/Mediumの一部）は、正規化されたマスタテーブルから参照するのではなく、**検索対象となる `Articles` テーブル自体に直接カラムとして持ちます（非正規化）。**
これにより、一覧表示や検索時の TABLE JOIN を回避し、単一テーブルへの単純かつ高速なクエリを実現します。

| Priority | Need | Key | DB Implementation Strategy |
| :--- | :--- | :--- | :--- |
| **High** | **基本属性** | Title, Composer, Catalogue | **Denormalized Columns (Article Translations)**<br>`article_translations.display_title`<br>`article_translations.composer_name`<br>`article_translations.catalogue_id`<br>※ インデックス効率を最大化 |
| **High** | **ジャンル・楽器** | Genre, Instrument | **Denormalized Columns**<br>`article_translations.genre` (Enum/Text)<br>`article_translations.instrumentation` |
| **High** | **Curation** | Featured, Popular | **Article Column**<br>`articles.is_featured` (Boolean) |
| **Med** | **Mood/Situation** | Tags (Mood) | **JSONB Index (GIN)**<br>`article_translations.metadata -> 'tags'`<br>※ 柔軟性を重視しJSONB配列で管理 |
| **Med** | **Era/Region** | Era, Nationality | **Denormalized Columns (Derived)**<br>`article_translations.era` (e.g. 'Baroque')<br>`article_translations.nationality`<br>※ フィルタリング用としてカラム化 |
| **Low** | **Score/Theory** | Structure, Key | **JSONB (No Index required initially)**<br>`article_translations.content_structure`<br>`article_translations.metadata -> 'key'` |
