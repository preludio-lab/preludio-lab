# Workflow: Content & Asset Generation (Content-GEN)

記事本文、譜例、画像、音源、翻訳といった「リッチコンテンツ」を生成・収集するためのマルチエージェント・ワークフローを定義します。

## 1. Sub-Workflows & Agents

### 1.1. Article-GEN (記事執筆)

- **エージェント協調**:
  - `Content-Director`: 全体の構成案 (Skeleton) を作成。
  - `Musicologist-Writer`: 共有コンテキスト（Master JSON）に基づき MDX 本文を執筆。
  - `Fact-Checker`: 記事内容とマスターデータの不整合を確認。
- **Output**: `src/content/articles/[lang]/<slug>.mdx`

### 1.2. Phrase-GEN (Async Score Worker)

- **役割**: 記事生成とは独立した非同期プロセスとして、SVG 譜例を生成。
- **エージェント協調**:
  - `Engraver`: 楽曲の特定箇所を ABC 記法または直接 SVG コードとして生成。
  - `Notation-Audit`: 音楽的な記譜規則（符尾の向き、アーティキュレーション等）をチェック。
- **技術的制約**: Verovio (WASM) の処理負荷が高いため、並列実行時はリソース管理に注意。

### 1.3. Image-GEN (バジュアル生成)

- **エージェント協調**:
  - `Visual-Designer`: プロンプトエンジニアリングを行い、Imagen 2 等のモデルで高品質なサムネイルや肖像画を生成（または既存画像をプロジェクト規格に最適化）。

### 1.4. Audio-Curator (音源選定)

- **エージェント協調**:
  - `Media-Scout`: YouTube Data API 等から最適な演奏をリストアップ。
  - `Artistic-Critic`: 演奏クオリティ、歴史的意義、音質に基づき最終選定。

### 1.5. Translation-GEN (多言語翻訳)

- **エージェント協調**:
  - `Polyglot-Translator`: 音楽用語の文脈を保ったまま 7 ヶ国語へ翻訳。
  - `Terminology-Guard`: 辞書（Taxonomy）と照合し、不適切な音楽用語の翻訳（例: Key -> 鍵）を自動修正。

## 2. Orchestration Cycle

1. **Skeleton Creation**: `Content-Director` がターゲット楽曲の分析 JSON を読み込み、どのセクションにどの `Phrase` や `Video` を配置するかを決定する。
2. **Parallel Production**: 記事、譜例、画像、音源選定を並列して実行。
3. **Assembly**: `Content-Director` が各アセットを統合し、完成した MDX を構築。
4. **Localization**: `Translation-GEN` がマスター記事を他言語へ展開。

## 3. Data Interface

### Input

- `targetWorkSlug`: 楽曲スラグ
- `masterContext`: `composer.json` および `work.json`

### Output

- MDX ファイル群
- 最適化済み画像ファイル (R2 アップロード用)
- 譜例データ
