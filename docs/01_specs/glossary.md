# Glossary (用語集)

PreludioLabプロジェクトにおける「ユビキタス言語（Ubiquitous Language）」を定義します。
開発者、PM、AIエージェント間で、言葉の定義を統一するために使用します。

> [!NOTE]
> AIエージェント（翻訳・執筆）用の多言語対訳データ（7ヶ国語）は [multilingual-dictionary.json](./multilingual-dictionary.json) で管理しています。
> 本ドキュメントは、主に**ドメイン概念の定義**と**日本語/英語の対応**に焦点を当てています。

## Domain: Content & Music (音楽・コンテンツ)

| Term (En) | Term (Ja) | Description | Context / Usage |
| :--- | :--- | :--- | :--- |
| **Work** | 作品 | 楽曲そのもの（例：平均律クラヴィーア曲集 第1巻）。 | Metadata (Title, Op) |
| **Movement** | 楽章/曲 | 作品の中の個別の曲（例：プレリュード）。 | `work_id` vs `movement_id` |
| **Score** | 楽譜 | 視覚化された音符情報。ABC記法で記述される。 | `<ScoreRenderer />` |
| **Analysis** | 分析 | 楽曲構造や理論的背景の解説テキスト。 | Agent Output |
| **Opus (Op.)** | 作品番号 | 出版順に割り振られた番号。 | `Op. 18`, `Op. 57` |
| **BWV** | BWV | バッハ作品番号 (Bach-Werke-Verzeichnis)。ジャンル別に整理されている。 | `BWV 846` |
| **Motif** | 動機 | 楽曲を構成する最小単位のメロディ断片。 | Analysis |
| **Voice** | 声部 | ポリフォニー音楽における独立した旋律線（ソプラノ、アルト、バス等）。 | Fugue Analysis |
| **Texture** | テクスチャ | 音の重なり具合や質感を指す（モノフォニー、ポリフォニー等）。 | Analysis |
| **Prelude** | 前奏曲 | 本編（フーガ等）の前に置かれる導入的な楽曲。 | Genre |
| **Fugue** | フーガ | 1つの主題が複数の声部で模倣・追走する対位法的な楽曲形式。 | Genre |

## Domain: System & Architecture (システム)

| Term (En) | Term (Ja) | Description | Context / Usage |
| :--- | :--- | :--- | :--- |
| **Frontmatter** | -- | MDXファイルの先頭にあるYAML形式のメタデータ領域。 | Blog Post |
| **Agent** | エージェント | 特定の役割（音楽学者、翻訳者）を持つAIプログラム。 | `agents/` |
| **Artifact** | 成果物 | エージェントが出力する最終ファイル（記事、画像）。 | `public/`, `content/` |
| **MDX** | MDX | Markdownファイル内でJSXコンポーネントを使用できるフォーマット。 | Content File |
| **Slug** | スラッグ | URLの一部となる、可読性のある識別文字列。 | `/read/[slug]` |
| **OGP** | OGP画像 | Open Graph Protocol。SNSでのシェア時に表示されるサムネイル画像。 | Metadata |
| **ABC Notation** | ABC記法 | テキストで楽譜情報を記述するフォーマット。 | `<ScoreRenderer abc="..." />` |
| **Token** | トークン | デザインシステムにおける最小単位の値（色、スペース、フォントサイズ）。 | Tailwind Config |
