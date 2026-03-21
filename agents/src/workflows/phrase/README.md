# Phrase Generation Workflow (Refined)

本ワークフローは、高品質な譜例（musical phrases）を自動生成するためのパイプラインです。 MusicXMLを標準形式とし、ソース取得、フレーズ抽出、 VerovioによるSVGレンダリング、およびCloudflare R2への永続化を自動化します。

## ワークフローの全体像

「File Bucket Relay」方式に基づき、各ステップは独立したスクリプトとして実装されます。

### ディレクトリ構成案

```text
phrase/
├── README.md                 # 本ドキュメント
├── 01-source-retrieval.ts     # データ取得・XML正規化・R2保存（Original）
├── 02-phrase-extraction.ts    # 小節抽出 + 属性（Clef/Key/Time）注入
├── 03-svg-render.ts           # Verovioを使用した MusicXML -> SVG 生成
└── 04-validation-publish.ts   # 品質検証 + R2へのアップロード（Phrase XML & SVG）
```

## 各ステップの詳細仕様

### 1. Source Retrieval (`01-source-retrieval.ts`)

- **役割**: 信頼できるリポジトリからデータを取得し、MusicXML形式に正規化してR2に保存する。
- **データソース**:
  - `OpenScore` (GitHub): MusicXML
  - `Mutopia Project`: MusicXML
  - `KernScores`: Humdrum (`*.krn`) -> MusicXMLへの自動変換。
- **永続化 (R2)**:
  - パス: `sources/{composer_id}/{work_id}/full.musicxml`
- **出力**: `workspace/cache/full.musicxml`

### 2. Phrase Extraction (`02-phrase-extraction.ts`)

- **役割**: 指定された小節範囲を抽出し、レンダリングに必要な属性情報を再構築する。
- **重要ロジック (Attribute Injection)**:
  - 単に小節を切り出すだけでなく、抽出範囲の直前までに定義されている最新の **音部記号 (Clef)**、**調号 (Key)**、**拍子記号 (Time)** を特定し、抽出したフレーズの先頭小節に注入する。これを行わないとレンダリングが崩れます。
- **出力**: `workspace/temp/phrase.musicxml`

### 3. SVG Rendering (`03-svg-render.ts`)

- **役割**: `Verovio` を使用して MusicXML から直接 SVG を生成する。
- **注意**: ABC記法は表現力の欠落リスクがあるため使用しません。MusicXMLの微細なアーティキュレーションをそのままSVGに反映します。
- **スタイリング**: `score-notation-guidelines.md` に基づき、モバイル最適化設定を適用。
- **出力**: `workspace/temp/phrase.svg`

### 4. Validation & Publish (`04-validation-publish.ts`)

- **役割**: 生成物の品質チェックを行い、合格したものを R2 に永続化する。
- **チェック項目**:
  - 属性情報の欠落による描画崩れがないか。
  - 音楽的な文脈（終止感など）の妥当性。
- **永続化 (R2)**:
  - パス: `phrases/{composer_id}/{work_id}/{phrase_id}.svg`
  - パス: `phrases/{composer_id}/{work_id}/{phrase_id}.musicxml`

## 設計思想の更新

- **Standardization on MusicXML**: クラシック音楽の精密な表現を維持するため、パイプライン全体で MusicXML を「正」のフォーマットとして扱います。
- **R2 Persistence**: 一時ファイルではなく、再利用性と配信コストを考慮して Cloudflare R2 を中心とした永続化を行います。
- **Human-in-the-Loop**: 自動抽出が困難な場合は、MDX側から小節番号を指定してワークフローを再トリガーできる冪等性を確保します。
