# PreludioLab Glossary & Domain Language

PreludioLabプロジェクトにおける「ユビキタス言語（Ubiquitous Language）」を定義します。
開発者、PM、AIエージェント間で、言葉の定義を統一するために使用します。

> [!NOTE]
> **To AI Agents**: This glossary is the **single source of truth** for domain terminology.
> When generating code or documentation, strictly adhere to the **Code / ID** and **Nuance / Policy** defined below.

## 1. Core Music Entities (核となる音楽概念)

音楽ドメインの中核をなすエンティティ群です。

| Term | Code / ID | Definition | Nuance / Policy |
| :--- | :--- | :--- | :--- |
| **Composer** | `Composer` | 作曲家。生涯・国籍・マスタデータを管理。 | 「人物」ではなく「芸術家」として敬意を払う。一意な `slug` (e.g., `bach`) で識別される。 |
| **Work** | `Work` | 楽曲の実体（例：運命）。不変のメタデータを持つ親エンティティ。 | 「曲」ではなく「作品」と呼称する。言語普遍的なIDを持つ。 |
| **Article** | `Article` | `Metadata` と `Content` で構成される、解説記事の最小単位。 | 単なる「ページ」ではなく、特定の楽曲（Work）に対する音楽的知見をパッケージ化したもの。 |
| **Article Metadata** | `ArticleMetadata` | 記事に紐付く構造化データ（作曲家、ジャンル、6軸印象値、タグ、Slug等）。 | 検索エンジンやAIエージェントが「記事を理解・分類」するために使用する情報の総称。 |
| **Series** | `Series` | 共通のテーマ（例：連載もの）で構成される記事のグループ。 | 1つの「親記事（Header）」を持ち、複数の「子記事」を順序（Sort Order）付きで管理。 |
| **Content** | `Content` | 記事の実体。MDXファイルとして保存され、テキスト、譜例、動画などのセクションで構成される。 | `Article` の内部データ。見出し構造 (`ContentStructure`) を持つ。 |
| **Musical Example** | `MusicalExample` | 解説のために引用される数小節の楽譜抜粋。 | 楽曲解説の中核となる「概念・単位」。 |
| **Notation Data** | `NotationData` | 譜例のソースデータ（ABC記法など）。 | `MusicalExample` の実体データ。R2等に保存。 |
| **Music Display** | `MusicDisplay` | 譜例、再生、翻訳が統合されたUI。 | ユーザーが触れるReact等のコンポーネント。 |
| **Recording** | `Recording` | 楽曲の演奏を記録したもの。誰のいつの演奏かを管理する実体。 | ユーザーが「聴く」対象。`RecordingSource` (YouTube/Spotify) を複数持つことができる。 |
| **Catalogue** | `CatalogueNumber` | 楽曲を識別するための作品番号（Op., BWV, K. など）。 | 原則として翻訳しない（後述の Strategic Nuances 参照）。 |
| **Excerpt** | `Excerpt` | 記事一覧や検索結果に表示される「抜粋・概要」。 | SEO上の Description としても機能する。 |
| **Genre** | `Genre` | 音楽的な分類（例：Prelude, Fugue, Symphony）。 | `Category='genre'` のタグとして管理される。 |
| **Era** | `Era` | 音楽史における時代区分（例：Baroque, Romantic）。 | `Category='era'` のタグとして管理される。 |
| **Instrumentation** | `Instrumentation` | その作品を演奏するために必要な楽器の構成（例：ピアノ独奏、弦楽四重奏）。 | 楽曲の検索・分類における最重要軸の一つ。具体的な項目は Taxonomy にて定義される。 |

## 2. User & Interaction (ユーザーサイド)

ユーザーの行動や状態に関する定義です。

| Term | Code / ID | Definition | Nuance / Policy |
| :--- | :--- | :--- | :--- |
| **Engagement** | `Engagement` | ユーザーの反応（Read, Scroll, Click等）の総称。 | 嗜好分析のため `passive`（滞在）/ `active`（クリック）に分類される。 |
| **Audition** | `Audition` | 譜例や音源の再生実行アクション。 | 単なるページ閲覧（PV）より強い関心シグナル。 |
| **Like** | `Like` | 記事や楽曲への明示的な「お気に入り」。 | ユーザーが能動的に保存したポジティブな反応。 |
| **Resonance** | `Resonance` | 楽曲に対する短い感想やメモの投稿。 | 単なる「Comment」ではなく、音楽との共鳴を記録するニュアンス。 |
| **Collection** | `Collection` | ユーザーが作成する独自の楽曲リスト。 | 「プレイリスト」よりも個人の「書斎（Library）」的な趣。 |
| **Mastery** | `Mastery` | 楽曲詳細を読み、音源も聴了して理解を深めた状態。 | 10,000記事を「踏破」していくゲーミフィケーション要素。 |
| **Impressions** | `Impressions` | 楽曲から受ける印象を複数の指標で数値化したもの（-10 〜 +10）。 | セマンティック・ディファレンシャル法による多次元評価。 |
| **Maestro** | `Maestro` | Google SSOによる認証済みユーザー。 | サイトの「正会員」。永続的なCollectionやResonanceを保持できる。 |
| **Listener** | `Listener` | 非ログイン（ゲスト）ユーザー。 | 匿名だが、セッションベースで一時的なEngagementを保持。 |
| **Persona** | `Persona` | 行動ログからAIが推定したユーザーの音楽的嗜好。 | 時代、楽器、気分などの傾向を多次元ベクトル化したもの。 |
| **Overture** | `Overture` | AIが生成する、特定ユーザーにパーソナライズされた楽曲紹介文。 | サイト名「Preludio」に呼応。体験の「序曲」。 |
| **Trace** | `Trace` | ユーザーが楽曲間を遷移した軌跡。 | 「この曲の次はこれ」という相関関係の自動生成に使用。 |

## 3. Editorial & Curation (編集・キュレーション)

運営・編集上の意図や管理状態に関する定義です。

| Term | Code / ID | Definition | Nuance / Policy |
| :--- | :--- | :--- | :--- |
| **Featured** | `is_featured` | トップページ等で優先的に紹介される「おすすめ記事」の状態。 | 単なる新着ではなく、サイトの「顔」として編集部がキュレートした記事。 |
| **Recommended** | `is_recommended` | 1つの作品（Work）に対し、特に鑑賞を推奨する録音（Recording）。 | 膨大な録音の中から、入門者や深掘りしたいユーザーにまず勧めるべき「名盤」。 |
| **Status** | `ContentStatus` | 記事の公開・管理状態（Draft, Published 等）。 | ユーザーへの公開可否を制御する基本的なライフサイクル。 |

## 4. System & Architecture (システム・構成要素)

システムの構成要素や技術的な概念です。

| Term | Code / ID | Definition | Nuance / Policy |
| :--- | :--- | :--- | :--- |
| **Agent** | `Agent` | 特定の役割（音楽学者、翻訳者）を持つAIプログラム。 | `agents/` ディレクトリ以下に配置される。 |
| **Artifact** | `Artifact` | エージェントが出力する最終ファイル（記事MDX、画像等）。 | ユーザーに価値を提供する成果物。 |
| **Slug** | `Slug` | URLの一部となる、可読性のある識別文字列。 | 開発者体験 (DX) とSEOのためにIDではなくSlugを優先して使用する。 |
| **Frontmatter** | `Frontmatter` | MDXファイルの先頭にあるYAML形式のメタデータ領域。 | 記事の静的なメタ情報を保持する。 |
| **MDX** | `MDX` | Markdown + JSX。記事コンテンツのフォーマット。 | コンポーネント（`<ScoreRenderer />`等）を埋め込むことができる。 |
| **Recording Source** | `RecordingSource` | YouTubeやSpotifyなど、録音の具体的な提供元とID。 | 1つの `Recording` は複数の `Source` を持つことができ、環境に応じて切り替える。 |
| **Playback Binding** | `PlaybackBinding` | 譜例（Musical Example）と音源の特定の時間（秒数）を紐付ける定義。 | 譜例の再生ボタンが録音の「どこ」から再生されるかを司る連携ロジック。 |
| **Player** | `Player` | 音源（Recording）を再生するUIコンポーネントの総称。 | 以下の `Compact`, `Immersive`, `Video` の各プレイヤーを包含する抽象概念。 |
| **Compact Player** | `CompactPlayer` | 画面下部などに常駐し、再生制御を行うバー形式のプレイヤー。 | ユーザーが記事を読みながら操作するメインのコントロール。 (旧: Mini Player) |
| **Immersive Player** | `ImmersivePlayer` | 作品の世界に没入するための、全画面表示の再生装置。 | 譜面や楽曲解説をより詳細に、集中して閲覧・試聴するためのモード。 (旧: Focus Player) |
| **Video Player** | `VideoPlayer` | YouTube等の動画コンテンツを埋め込み・再生する装置。 | 視覚的な演奏情報を含む Recording を表示する際に使用。 |
| **Token** | `DesignToken` | デザインシステムにおける色、余白、フォントサイズ等の最小単位。 | Tailwind Config で定義される値を正とする。 |

## 5. Database & Infrastructure (データベース)

データ永続化とインフラストラクチャに関する用語です。

| Term | Code / ID | Definition | Nuance / Policy |
| :--- | :--- | :--- | :--- |
| **Turso** | `Turso` | libSQLベースの分散エッジデータベース。 | 本プロジェクトの永続化層（Single Source of Truth）。 |
| **Zero-JOIN** | `ZeroJoinStrategy` | 検索時の結合（JOIN）を排除し、アクセス速度を最大化する設計戦略。 | 読み取り頻度の高いデータは非正規化して `sl_` プレフィックスのカラムに持つ。 |
| **Snapshot** | `Snapshot` | 非正規化して保持されるデータの断面（`sl_` columns）。 | マスタデータの変更に追従して更新される必要がある。 |
| **Vector Search** | `VectorSearch` | ベクトル埋め込みを用いた意味論的検索。 | `libsql-vector` を使用。曖昧なクエリ（例：「朝に聴きたい曲」）に強い。 |
| **FTS5** | `FTS5` | SQLite標準の全文検索エンジン。 | キーワード一致（例：「BWV 846」）に強い。Vectorとハイブリッドで利用する。 |
| **Passage** | `Passage` | ベクトル化の対象となるテキスト塊。 | 多言語検索のために、英語マスタデータを含めて構築する（`passage: ` prefix必須）。 |

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
