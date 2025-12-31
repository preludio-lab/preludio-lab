# Content Quality & Structure Requirements (v1.0)

## 1. Content Mission

**"The Gold Standard of Digital Program Notes"**
コンサートのプログラムノートよりも深く、専門書よりは読みやすい。
構造を知ることは、感動を深めるための鍵である。分析そのものを目的とせず、あくまで「より深く楽しむ」ためのガイドとして機能する記事を目指す。

## 2. Article Structure Standard

全ての楽曲分析記事は、以下の構成に従うこと。

### [REQ-CONT-STR-001] Introduction (導入)

- **[REQ-CONT-STR-001-01] Hook:** 読者の興味を惹く「フック」を用意する（例：「なぜこの曲は"革命"と呼ばれるのか？」）。
- **[REQ-CONT-STR-001-02] Basic Info:** 楽曲の基本情報（調性、形式、作曲年）を簡潔に提示する。

### [REQ-CONT-STR-002] Historical Context (背景)

- **[REQ-CONT-STR-002-01] Biography Context:** 作曲家の人生における位置づけ。
- **[REQ-CONT-STR-002-02] Episode:** 初演時のエピソードや、当時の社会的背景。

### [REQ-CONT-STR-003] Structural Analysis (構造分析) - **CORE VALUE**

- **[REQ-CONT-STR-003-01] Concrete Terms:** 抽象的な感想ではなく、具体的な「小節数（Measure）」と「音楽用語」を用いて解説する。
- **[REQ-CONT-STR-003-02] ABC Notation:** 重要なテーマや動機（Motif）については、必ず **ABC記法による譜面** を挿入する。
- **[REQ-CONT-STR-003-03] Audio Sync:** 譜面には、そのフレーズのYouTube再生時間（Start/End）をメタデータとして付与し、クリック再生可能にする。
- **[REQ-CONT-STR-003-04] Accessibility:** 専門用語（「ドミナント」「展開部」「偽終止」など）は使用するが、文脈から意味が推測できるように書く。

### [REQ-CONT-STR-005] File Naming Convention

- **[REQ-CONT-STR-005-01] Rule:** コンテンツのファイル名は、別途定義する「命名規則ガイドライン」に厳格に従うこと。URL（Slug）とファイル名は一致させる。

### [REQ-CONT-STR-006] Excerpt Policy (引用方針)

作成負荷とUXのバランスを考慮した、譜例と音源の取り扱い基準。

- **[REQ-CONT-STR-006-01] Score Length:** 視覚的な譜例は「4〜8小節（数秒〜10秒）」の**重要モチーフのみ**に限定する。スマホでの視認性を高め、作成負荷（ABC記法の手修正）を最小化する。
- **[REQ-CONT-STR-006-02] Audio Context:** 譜例は短くとも、再生は**「その後の展開」まで含めて長く（15〜30秒以上、または停止するまで）**行う。
  - **Reason:** 音楽は文脈（Context）が重要であるため、譜例が終わった瞬間に音が止まると没入感が削がれるため。譜例は「道標」として機能させ、耳では続きを楽しめるようにする。

### [REQ-CONT-STR-004] Listening Guide (聴きどころ)

- **[REQ-CONT-STR-004-01] Intuitive:** 理論がわからなくても楽しめる、直感的なポイント。
- **[REQ-CONT-STR-004-02] Timestamp:** YouTube動画の具体的なタイムスタンプ（例: `03:45`）を提示し、プレーヤーと連動させる。

## 3. Editorial Guidelines

### Tone of Voice

### Tone of Voice

- **[REQ-CONT-EDIT-001] Friendly & Accessible:** 親しみやすさを重視する。専門的な内容であっても、読者を突き放さず、隣で語りかけるようなトーン（"Guide"）を心がける。情熱的であることは良いが、独りよがりな熱弁は避ける。
- **[REQ-CONT-EDIT-002] Global Neutral:** 特定の文化に依存しすぎる比喩は避け、翻訳しやすい平易なロジックで記述する。

### Multilingual Policy

- **[REQ-CONT-LANG-001] Source Language:** 原則として「日本語」をマスターデータとし、他言語へ展開する。
- **[REQ-CONT-LANG-002] Proper Nouns:** 人名・曲名は、各言語の一般的な表記に従う（例: Bach -> バッハ）。

## 4. Content Taxonomy

サイト内のコンテンツを以下のカテゴリに分類する。

- **[REQ-CONT-TAX-001] Work Introduction (楽曲紹介):** 個別の楽曲の魅力紹介。初心者にも分かりやすい「入り口」としての解説記事。SEOキーワードとしては「分析 (Analysis)」も狙うが、ユーザーへの見せ方は「紹介」とする。
- **[REQ-CONT-TAX-002] Composer (作曲家):** 作曲家の生涯、スタイル、代表作の紹介。 (例: バッハ、ベートーヴェン)
- **[REQ-CONT-TAX-003] Theory (音楽の仕組み):** 形式（ソナタ形式など）、和声、記譜法などの理論解説。
- **[REQ-CONT-TAX-004] Era (時代様式):** 各時代（バロック、古典派、ロマン派など）の歴史的背景と様式の特徴。
- **[REQ-CONT-TAX-005] Instrument (楽器):** 楽器の歴史、構造、代表的なレパートリー。
- **[REQ-CONT-TAX-006] Performer (演奏家):** 指揮者、ソリスト、オーケストラのエピソードと名盤紹介。
- **[REQ-CONT-TAX-007] Terminology (用語集):** 独自辞書。楽語（Andante, Crescendoなど）の意味と演奏上の解釈。
- **[REQ-CONT-TAX-008] Column (コラム):** エッセイ、ニュース、特集記事（「映画の中のクラシック」など）。
- **[REQ-CONT-TAX-009] Originals (オリジナル作品):** 管理人（あなた）による自作曲の紹介と解説。PreludioLabだけの限定コンテンツ。

## 5. Series / Collections

複数のコンテンツを特定のテーマでグルーピングする機能。

### [REQ-CONT-SERIES] Series Definitions

- **[REQ-CONT-SERIES-001] Concept:** 「ピアノ協奏曲名曲選」「バッハのオルガン作品全集」「初心者向け音楽理論コース」など、文脈のあるまとまりを提供する。
- **[REQ-CONT-SERIES-002] Structure:**
  - **Parent:** シリーズのトップページ（目次、概要）。
  - **Children:** シリーズに属する各記事。
- **[REQ-CONT-SERIES-003] Navigation:**
  - 記事ページ内に「シリーズ目次」へのリンク、および「前の記事」「次の記事」へのナビゲーションを自動生成する。

## 6. Data Schema (MDX Frontmatter)

### [REQ-CONT-SCHEMA-001] Schema Compliance

記事のメタデータ定義。全てのMDXファイルはこのスキーマに準拠する必要がある。

| Field             | Type     | Required | Description                                                                      | Example / Rules                                                                                              |
| :---------------- | :------- | :------- | :------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **title**         | `string` | **Yes**  | 記事のタイトル。                                                                 | "Prelude in C Major, BWV 846"                                                                                |
| **description**   | `string` | **Yes**  | 記事の概要（Meta Description用）。120文字以内。                                  | -                                                                                                            |
| **category**      | `enum`   | **Yes**  | 記事の分類。                                                                     | `Introduction`, `Composer`, `Theory`, `Era`, `Instrument`, `Performer`, `Terminology`, `Column`, `Originals` |
| **composer**      | `string` | No       | 作曲家名（各言語の一般表記）。`Introduction` カテゴリでは必須。                  | "Johann Sebastian Bach"                                                                                      |
| **work_id**       | `string` | No       | 作品番号。`Introduction` カテゴリでは必須。                                      | "BWV 846", "Op. 57"                                                                                          |
| **key**           | `string` | No       | 調性。                                                                           | "C Major", "cis-moll"                                                                                        |
| **difficulty**    | `1-5`    | No       | 演奏または理解の難易度。                                                         | 1(Beginner) - 5(Virtuoso)                                                                                    |
| **tags**          | `array`  | No       | 検索用タグ。                                                                     | `["Baroque", "Keyboard"]`                                                                                    |
| **date**          | `date`   | **Yes**  | 公開日 (YYYY-MM-DD)。                                                            | "2025-12-09"                                                                                                 |
| **updated**       | `date`   | No       | 最終更新日 (YYYY-MM-DD)。                                                        | -                                                                                                            |
| **series**        | `string` | No       | シリーズID（Slug）。シリーズに含まれる場合のみ指定。                             | "well-tempered-clavier-book1"                                                                                |
| **thumbnail**     | `string` | No       | サムネイル画像パス（OGP用）。                                                    | "/images/scores/bwv846.jpg"                                                                                  |
| **youtube_id**    | `string` | No       | メイン音源のYouTube ID（自動埋め込み用）。                                       | "dQw4w9WgXcQ"                                                                                                |
| **youtube_start** | `string` | No       | YouTube再生開始時間（HH:MM:SS）。                                                | "00:00:00"                                                                                                   |
| **youtube_end**   | `string` | No       | YouTube再生終了時間（HH:MM:SS）。                                                | "00:00:00"                                                                                                   |
| **ogp_excerpt**   | `string` | No       | OGP画像生成用のABC譜面コード（短い重要モチーフ）。未指定の場合はデフォルト画像。 | "L:1/8 cdef gabc'"                                                                                           |

## 7. Editorial Curation & Discovery

プラットフォームとしてのアイデンティティを提示し、ユーザーの「発見」を支援するためのキュレーション指針。

### [REQ-CONT-CURATION-001] Human-In-The-Loop Curation

- **[REQ-CONT-CURATION-001-01] is_featured (Articles):** PV数などの動的データとは別に、編集上の意図（特集、季節性、ブランド価値の象徴）に基づいて手動で付与する。
- **[REQ-CONT-CURATION-001-02] is_recommended (Recordings):** 音源が大量にある場合、Musicologist（またはAI）が「教育的・構造理解的に最適」と判断した音源を推奨盤として固定する。

### [REQ-CONT-CURATION-002] Hybrid Recommendation Model

UI/UX層では、以下の3層を組み合わせてコンテンツを提示する。

1.  **Editorial:** `is_featured` 等に基づく、プラットフォーム側からのメッセージ。
2.  **Popularity:** ユーザーのインタラクション（PV、滞在時間、Like数）に基づく動的なランキング。
3.  **Discovery:** ベクトル埋め込み（`embedding`）に基づく、ユーザーの現在の文脈に沿った類似推薦。
