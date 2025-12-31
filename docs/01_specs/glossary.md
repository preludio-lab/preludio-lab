# Glossary (用語集)

PreludioLabプロジェクトにおける「ユビキタス言語（Ubiquitous Language）」を定義します。
開発者、PM、AIエージェント間で、言葉の定義を統一するために使用します。

> [!NOTE]
> AIエージェント（翻訳・執筆）用の多言語対訳データ（7ヶ国語）は [multilingual-dictionary.json](./multilingual-dictionary.json) で管理しています。
> 本ドキュメントは、主に**ドメイン概念の定義**と**日本語/英語の対応**に焦点を当てています。

## Domain: Content & Music (音楽・コンテンツ)

| Term (En) | Term (Ja) | Description | Context / Usage |
| :--- | :--- | :--- | :--- |
| **Article** | 記事 | URLを持つWeb上の１ページ単位。コンテンツ管理の最小親エンティティ。メタデータ（作曲家、作品、おすすめフラグ等）を持つコンテナ。 | `/works/[slug]` |
| **Content** | 本文/コンテンツ | 記事の実体。MDXファイルとして保存され、テキスト、譜例、動画などのセクションで構成される。 | Storage (`.mdx`) |
| **Work** | 作品 | 楽曲そのもの（例：平均律クラヴィーア曲集 第1巻）。言語に依存しない普遍的な作品（マスタ）情報。 | Metadata (Title, Op) |
| **Score** | 楽譜データ | 楽曲の音楽情報を記述したデータ（例：ABC記法）。言語に依存しない「楽譜の原版」。 | Shared Asset |
| **Sheet Music** | 譜例 | ユーザーに表示されるレンダリング済みの楽譜。Scoreデータと、言語ごとのキャプションを組み合わせたもの。 | UI Component |
| **Media** | メディア | 記事や楽譜に関連付けられた非テキストリソースの総称（音声、動画、画像）。 | `media_resources` |
| **Recording** | 音源 | 楽曲の演奏を記録したもの。ユーザーが「聴く」対象となる実体。VideoまたはAudio形式で提供される。 | Domain Concept |
| **Audio** | 音声 | 映像を含まない音声のみのデータ形式（MP3, AAC等）。またはSpotify等の配信形態。 | Format / Source |
| **Video** | 動画 | 映像を含むデータ形式（MP4, YouTube等）。 | Format / Source |
| **Image** | 画像 | 静止画データ（OGP, アートワーク, 楽譜プレビュー画像）。 | Format |
| **Player** | プレイヤー | 音源（Recording）を再生するコンポーネントの総称。AudioPlayer（音声）だけでなく、将来的なVideoPlayer（YouTube埋め込み等）も含む抽象概念。 | `<AudioPlayer />`, `<VideoPlayer />` |
| **Analysis** | 分析 | 楽曲構造や理論的背景の解説テキスト。 | Agent Output |
| **Opus (Op.)** | 作品番号 | 出版順に割り振られた番号。 | `Op. 18` |
| **BWV** | BWV | バッハ作品番号 (Bach-Werke-Verzeichnis)。 | `BWV 846` |
| **Motif** | 動機 | 楽曲を構成する最小単位のメロディ断片。 | Analysis |
| **Voice** | 声部 | ポリフォニー音楽における独立した旋律線（ソプラノ、アルト、バス等）。 | Fugue Analysis |
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
