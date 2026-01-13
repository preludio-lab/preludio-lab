# PreludioLab Glossary & Domain Language

PreludioLabプロジェクトにおける「ユビキタス言語（Ubiquitous Language）」を定義します。
開発者、PM、AIエージェント間で、言葉の定義を統一するために使用します。

> [!NOTE]
> **To AI Agents**: This glossary is the **single source of truth** for domain terminology.
> When generating code or documentation, strictly adhere to the **Code / ID** and **Nuance / Policy** defined below.

## 1. Core Music Entities (核となる音楽概念)

音楽ドメインの中核をなすエンティティ群です。

| Term                | Code / ID         | Definition                                                               | Nuance / Policy                                                                         |
| :------------------ | :---------------- | :----------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| **Composer**        | `Composer`        | 作曲家。生涯・国籍・マスタデータを管理。                                 | 「人物」ではなく「芸術家」として敬意を払う。一意な `slug` (e.g., `bach`) で識別される。 |
| **Performer**       | `Performer`       | 演奏家・団体。指揮者、奏者、オーケストラ等。                             | `Recording` の主体。単なるラベルではなく、独自の `slug`を持つエンティティ。             |
| **Work**            | `Work`            | 楽曲の実体（例：運命）。不変のメタデータを持つ親エンティティ。           | 「曲」ではなく「作品」と呼称する。言語普遍的なIDを持つ。                                |
| **Recording**       | `Recording`       | 楽曲の演奏を記録したもの。誰のいつの演奏かを管理する実体。               | ユーザーが「聴く」対象。`RecordingSource` (YouTube/Spotify) を複数持つことができる。    |
| **Catalogue**       | `CatalogueNumber` | 楽曲を識別するための作品番号（Op., BWV, K. など）。                      | 原則として翻訳しない（後述の Strategic Nuances 参照）。                                 |
| **Genre**           | `Genre`           | 音楽的な分類（例：Prelude, Fugue, Symphony）。                           | `Category='genre'` のタグとして管理される。                                             |
| **Era**             | `Era`             | 音楽史における時代区分（例：Baroque, Romantic）。                        | `Category='era'` のタグとして管理される。                                               |
| **Instrumentation** | `Instrumentation` | その作品を演奏するために必要な楽器の構成（例：ピアノ独奏、弦楽四重奏）。 | 楽曲の検索・分類における最重要軸の一つ。具体的な項目は Taxonomy にて定義される。        |

## 2. Article Entities (記事ドメイン)

楽曲を解説し、ユーザーへ知見を届けるためのコンテンツ構造に関する定義です。

| Term                   | Code / ID           | Definition                                                                                            | Nuance / Policy                                                                                                                                |
| :--------------------- | :------------------ | :---------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **Article**            | `Article`           | `ArticleControl`, `Metadata`, `Content`, `Engagement`, `Context` で構成されるエンティティの最小単位。 | 単なる「ページ」ではなく、特定の楽曲（Work）に対する音楽的知見をパッケージ化したもの。これらパーツを束ねる「コーディネーター」として機能する。 |
| **Article Control**    | `ArticleControl`    | 記事のライフサイクルやアイデンティティを管理する制御情報。                                            | `id`, `lang`, `status`, `publishedAt` 等を含む、記事の「外箱」としての属性。                                                                   |
| **Article Metadata**   | `ArticleMetadata`   | 記事に紐付く構造化データ（作曲家、ジャンル、6軸印象値、タグ、Slug等）。                               | 検索エンジンやAIエージェントが「記事を理解・分類」するために使用する情報の総称。一覧表示や発見（Discovery）に必要なすべての属性を包含する。    |
| **Article Content**    | `ArticleContent`    | 記事の実体データ。本文と構造（ToC）を含むモジュール。                                                 | ユーザーが記事を読み始めた際に必要となる情報のセット。                                                                                         |
| **Content Body**       | `ContentBody`       | 記事の本文。MDX形式の生テキスト。                                                                     | `ArticleContent` の主要パーツ。実装上のプロパティ名は `body` となる。                                                                          |
| **Content Structure**  | `ContentStructure`  | 記事全体の目次（ToC）構造。`ContentSection` のツリーとして表現される。                                | `ArticleContent` のパーツ。記事タイトル (`h1`) を頂点とした論理構造。                                                                          |
| **Article Engagement** | `ArticleEngagement` | ユーザーの反応や没入度を示す動的なメトリクス。                                                        | 閲覧数、いいね数、平均滞在時間等の統計データ。一覧表示でのソーシャルプルーフとしても使用される。                                               |
| **Article Context**    | `ArticleContext`    | 記事に付随する「文脈」や「関連情報」。                                                                | 参照元（Source Attribution）、収益化要素（Monetization Element）、所属シリーズ、関連記事等の、記事の外部世界との関係定義。                     |
| **Series**             | `Series`            | 共通のテーマ（例：連載もの）で構成される記事のグループ。                                              | 1つの「親記事（Header）」を持ち、複数の「子記事」を順序（Sort Order）付きで管理。                                                              |
| **Related Article**    | `RelatedArticle`    | 記事の内容や楽曲の文脈に基づき、静的に紐付けられた関連コンテンツ。                                    | 編集部による手動選定、または埋め込みベクトルを用いた静的な類似度計算によって決定される「知のネットワーク」。                                   |
| **Content Section**    | `ContentSection`    | 記事本文内の論理的な区切り。ID、見出し、レベル、子要素を持つ。                                        | `id` はアンカー用、`heading` は表示用。レベルは `h2`〜`h6` を基本とする。                                                                      |
| **Content Structure**  | `ContentStructure`  | 記事全体の目次（ToC）構造。`ContentSection` のツリーとして表現される。                                | 記事タイトル (`h1`) を頂点とした論理構造を記述する。                                                                                           |
| **Musical Example**    | `MusicalExample`    | 解説のために引用される楽譜の抜粋。特定の `Score` を参照し、`Work` の文脈（楽章等）を持つ。            | 楽曲解説の中核となる「概念・単位」。`slug` で識別され、再生同期情報を持つ。                                                                    |
| **Score**              | `Score`             | 特定の楽曲の楽譜（版・エディション）全体を指す実体。                                                  | 購入リンクやPDFを持つ「アセット（資産）」。エディションごとの差異を管理する。                                                                  |
| **Notation Data**      | `NotationData`      | 譜例のソースデータ（ABC記法など）。                                                                   | `MusicalExample` の実体データ。R2等に保存。                                                                                                    |
| **Notation Visual**    | `NotationVisual`    | 譜例（Notation Data）を描画した視覚的な成果物（SVG、PNG等）。                                         | 事前レンダリングされたアセット。表示速度向上のために使用される。                                                                               |
| **Music Display**      | `MusicDisplay`      | 譜例、再生、翻訳が統合されたUI。                                                                      | ユーザーが触れるReact等のコンポーネント。                                                                                                      |
| **Excerpt**            | `Excerpt`           | 記事一覧や検索結果に表示される「抜粋・概要」。                                                        | SEO上の Description としても機能する。                                                                                                         |

## 3. User & Interaction (ユーザー)

### 2.1. Interaction & User Concepts (行動・ユーザー概念)

ユーザーの直接的なアクションや、サイト上での状態・役割に関する定義。

| Term                  | Code / ID           | Definition                               | Nuance / Policy                                         |
| :-------------------- | :------------------ | :--------------------------------------- | :------------------------------------------------------ |
| **Engagement**        | `Engagement`        | ユーザーの反応。没入やアクションの総称。 | 内部的に `passive` / `active` に分類して分析。          |
| **Audition**          | `Audition`          | 譜例や音源の再生実行アクション。         | 単なる閲覧より強い関心を示す重要シグナル。              |
| **Like**              | `Like`              | 記事や楽曲への明示的な「お気に入り」。   | ユーザーが能動的に保存したポジティブな反応。            |
| **Resonance**         | `Resonance`         | 楽曲に対する短い感想やメモの投稿。       | 単なるコメントではなく、音楽との共鳴を記録する概念。    |
| **Collection**        | `Collection`        | ユーザーが作成する独自の楽曲リスト。     | 「プレイリスト」よりも個人の「書斎（Library）」的な趣。 |
| **Mastery**           | `Mastery`           | 楽曲を聴了し、理解を深めた状態。         | 10,000記事を「踏破」していくゲーミフィケーション要素。  |
| **Impressions**       | `Impressions`       | 楽曲から受ける多次元評価（-10 〜 +10）。 | セマンティック・ディファレンシャル法による感性指標。    |
| **Member**            | `Member`            | 認証済みユーザー。                       | UI上の呼称は「Maestro」。Collection等を保持できる。     |
| **Guest**             | `Guest`             | 非ログイン（ゲスト）ユーザー。           | UI上の呼称は「Listener」。セッションベースで計測。      |
| **Persona**           | `Persona`           | AIが推定したユーザーの音楽的嗜好。       | 時代、楽器、気分などの傾向を多次元ベクトル化したもの。  |
| **PersonalizedIntro** | `PersonalizedIntro` | パーソナライズされた楽曲紹介文。         | UI上の呼称は「Overture（序曲）」。                      |

### 2.2. Activity & Growth Metrics (分析指標・グロース)

サイトの成長やユーザーの没入度を客観的に計測するための指標。

| Term               | Code / ID        | Definition                                     | Nuance / Policy                                                                        |
| :----------------- | :--------------- | :--------------------------------------------- | :------------------------------------------------------------------------------------- |
| **Immersion**      | `Immersion`      | ユーザーの没入度を示す統合指標。               | `PageView`, `TimeOnPage`, `Audition` 等から算出される体験の質。                        |
| **PageView**       | `PageView`       | 記事が閲覧された回数。                         | 単なるカウントではなく、楽曲が「発見」された機会。                                     |
| **TimeOnPage**     | `TimeOnPage`     | 記事の滞在（没入）時間。                       | 音楽を聴き、譜面を追う「質の高い時間」を計測。                                         |
| **AffiliateClick** | `AffiliateClick` | 外部販売サイト（楽譜・CD等）への遷移。         | ユーザー体験と収益性のバランスを測る重要指標。                                         |
| **Exit**           | `Exit`           | 記事からの離脱。                               | 離脱ポイントを特定し、AIによる改善（LPO）の根拠とする。                                |
| **SocialShare**    | `SocialShare`    | SNS等へのシェアアクション。                    | 知見が外部へ波及したシグナル。                                                         |
| **Referral**       | `Referral`       | 未知の楽曲を他者に薦める・招待するアクション。 | ユーザー間での楽曲の伝播を計測。                                                       |
| **NavigationFlow** | `NavigationFlow` | ユーザーが辿った遷移の軌跡。                   | 記事間の相関関係の分析や、AIによる次楽曲推薦（Next-to-Play）の学習用データとして使用。 |

## 4. Editorial & Curation (編集・キュレーション)

運営・編集上の意図や管理状態に関する定義です。

| Term                     | Code / ID             | Definition                                                     | Nuance / Policy                                                               |
| :----------------------- | :-------------------- | :------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| **Source Attribution**   | `SourceAttribution`   | 記事生成や楽曲解説に使用した参考文献や一次情報の根拠。         | 信頼性を担保するため、タイトルとURLを保持。IMSLPやWikipedia等のソースを明示。 |
| **Monetization Element** | `MonetizationElement` | 記事に紐付く収益化要素。アフィリエイトリンクや販売チャネル等。 | ユーザーに不快感を与えないよう、文脈に沿った「推薦」として配置。              |
| **Featured**             | `is_featured`         | トップページ等で優先的に紹介される「おすすめ記事」の状態。     | 単なる新着ではなく、サイトの「顔」として編集部がキュレートした記事。          |
| **Recommended**          | `is_recommended`      | 1つの作品（Work）に対し、特に鑑賞を推奨する録音（Recording）。 | 膨大な録音の中から、入門者や深掘りしたいユーザーにまず勧めるべき「名盤」。    |
| **Status**               | `ContentStatus`       | 記事の公開・管理状態（Draft, Published 等）。                  | ユーザーへの公開可否を制御する基本的なライフサイクル。                        |

## 5. System & Architecture (システム・構成要素)

システムの構成要素や技術的な概念です。

| Term                       | Code / ID               | Definition                                                               | Nuance / Policy                                                                                            |
| :------------------------- | :---------------------- | :----------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Agent**                  | `Agent`                 | 特定の役割（音楽学者、翻訳者）を持つAIプログラム。                       | `agents/` ディレクトリ以下に配置される。                                                                   |
| **Artifact**               | `Artifact`              | エージェントが出力する最終ファイル（記事MDX、画像等）。                  | ユーザーに価値を提供する成果物。                                                                           |
| **Slug**                   | `Slug`                  | URLの一部となる、可読性のある識別文字列。                                | 開発者体験 (DX) とSEOのためにIDではなくSlugを優先して使用する。                                            |
| **Frontmatter**            | `Frontmatter`           | MDXファイルの先頭にあるYAML形式のメタデータ領域。                        | 記事の静的なメタ情報を保持する。                                                                           |
| **MDX**                    | `MDX`                   | Markdown + JSX。記事コンテンツのフォーマット。                           | コンポーネント（`<ScoreRenderer />`等）を埋め込むことができる。                                            |
| **Recording Source**       | `RecordingSource`       | YouTubeやSpotifyなど、録音の具体的な提供元とID。                         | 1つの `Recording` は複数の `Source` を持つことができ、環境に応じて切り替える。                             |
| **Playback Binding**       | `PlaybackBinding`       | 譜例（Musical Example）と音源の特定の時間（秒数）を紐付ける定義。        | 譜例の再生ボタンが録音の「どこ」から再生されるかを司る連携ロジック。                                       |
| **Player**                 | `Player`                | 録音（Recording）を再生する機能を司るドメインエンティティ。              | 以下の `HIDDEN`, `MINI`, `IMMERSIVE` の各モードを持つ。                                                    |
| **Hidden Mode**            | `HIDDEN`                | プレイヤーが非表示の状態。                                               | 初期状態、または再生が停止されプレイヤーを閉じた際の状態。                                                 |
| **Mini Mode**              | `MINI`                  | 画面下部に常駐する、最小化されたプレイヤー。                             | 記事を読みながら再生制御を行うための「常時アクセス可能」なインターフェース。                               |
| **Immersive Mode**         | `IMMERSIVE`             | 作品の世界に没入するための、全画面表示の再生体験。                       | 譜面、楽曲解説、コントロールが統合され、ユーザーが音楽に深く没入するための最高位モード。(旧: Focus Player) |
| **Video Player**           | `VideoPlayer`           | YouTube等の動画コンテンツを埋め込み・再生する装置。                      | 視覚的な演奏情報を含む Recording を表示する際に使用。                                                      |
| **Recommendation Service** | `RecommendationService` | ユーザーの行動履歴や嗜好に基づき、動的に次のコンテンツを提案する仕組み。 | 記事固有の属性ではなく、ユーザーとの対話（Session/Identity）から生まれる動的な推薦結果を扱う。             |
| **Musical Media Pipeline** | `MusicalMediaPipeline`  | MusicXML/ABCから譜例データを生成し、配置するまでの一連の自動化フロー。   | 個人開発の運用負荷を下げるための、AIと連携したアセット管理プロセス。                                       |
| **Token**                  | `DesignToken`           | デザインシステムにおける色、余白、フォントサイズ等の最小単位。           | Tailwind Config で定義される値を正とする。                                                                 |

## 6. Database & Infrastructure (データベース)

データ永続化とインフラストラクチャに関する用語です。

| Term              | Code / ID          | Definition                                                       | Nuance / Policy                                                                  |
| :---------------- | :----------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| **Turso**         | `Turso`            | libSQLベースの分散エッジデータベース。                           | 本プロジェクトの永続化層（Single Source of Truth）。                             |
| **Zero-JOIN**     | `ZeroJoinStrategy` | 検索時の結合（JOIN）を排除し、アクセス速度を最大化する設計戦略。 | 読み取り頻度の高いデータは非正規化して `sl_` プレフィックスのカラムに持つ。      |
| **Snapshot**      | `Snapshot`         | 非正規化して保持されるデータの断面（`sl_` columns）。            | マスタデータの変更に追従して更新される必要がある。                               |
| **Vector Search** | `VectorSearch`     | ベクトル埋め込みを用いた意味論的検索。                           | `libsql-vector` を使用。曖昧なクエリ（例：「朝に聴きたい曲」）に強い。           |
| **FTS5**          | `FTS5`             | SQLite標準の全文検索エンジン。                                   | キーワード一致（例：「BWV 846」）に強い。Vectorとハイブリッドで利用する。        |
| **Passage**       | `Passage`          | ベクトル化の対象となるテキスト塊。                               | 多言語検索のために、英語マスタデータを含めて構築する（`passage: ` prefix必須）。 |

## 6. Strategic Nuances (AIエージェントへの特別指示)

> **Note to AI Agent**: 以下の用語や設定は、翻訳やコンテンツ生成時に**厳格なルール**として適用してください。

### [i18n] Catalogue Numbers (作品番号)

- **Rule**: 作品番号（Op., BWV, K.）は、原則として各国語で翻訳せず、標準的な略称を維持する。
- **Exception**: 日本語のみ文脈により「作品10」のような表記を許容する場合があるが、検索キーや見出しは常に `Op. 10` とする。

### [UX] Impression Dimensions (多軸評価)

- **Scale**: -10 から +10 の整数値（0はNeutral）。
- **Mapping**: `sl_impression_dimensions` カラムにJSON保存。
- **Usage**: 文章生成時はこの値を元に形容詞を選択すること。詳細は別途定義される指標（Taxonomy）を参照。

### [Search] Vectorization Prefixes

- **Rule**: E5モデルの性能を引き出すため、以下のプレフィックスを厳守する。
  - **Indexing**: `passage: ` (コンテンツ保存時)
  - **Query**: `query: ` (ユーザー検索時)
- **Visual**:
  - `passage: [EN] Symphony No.5 ...`
  - `query: 運命`

### [Translation] Tone & Voice

- **Japanese**: 「です・ます」調（敬体）を基本とするが、音楽的な解説では格調高さを維持する。
- **English**: 明瞭かつ専門的（Academic yet Accessible）。
