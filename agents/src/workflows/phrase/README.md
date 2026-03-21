# Phrase Generation Workflow

このディレクトリは、高品質な譜例（musical phrases）を自動生成するためのワークフローを管理します。
MusicXMLソースの取得から、フレーズの抽出、ABC記法への変換、およびSVGレンダリングまでの一連のプロセスを自動化します。

## ワークフローの全体像

本ワークフローは、複数の独立したステップ（スクリプト）で構成され、各ステップは中間成果物を介して連携します。これは「File Bucket Relay」方式に基づいています。

### ディレクトリ構成案

```text
phrase/
├── README.md                 # 本ドキュメント
├── 01-source-retrieval.ts     # OpenScore等からMusicXMLを取得
├── 02-phrase-extraction.ts    # 指定された小節範囲を抽出
├── 03-notation-conversion.ts  # MusicXML -> ABC記法への変換
├── 04-svg-render.ts           # Verovioを使用したSVG生成
└── 05-validation.ts           # 音楽的・視覚的な品質検証
```

## 各ステップの詳細

### 1. Source Retrieval (`01-source-retrieval.ts`)

- **役割**: 信頼できるリポジトリから MusicXML データを取得する。
- **データソース**:
  - `OpenScore` (GitHub): 合唱、歌曲などの高品質なソース。
  - `KernScores`: 対応楽曲が豊富なリサーチデータベース。
- **出力**: `workspace/cache/{composer}/{work}.musicxml`

### 2. Phrase Extraction (`02-phrase-extraction.ts`)

- **役割**: 巨大なスコアから、譜例として適切な小節（通常4-8小節）を抽出する。
- **ロジック**:
  - LLM エージェント（Composer）が、楽曲の「代表的なテーマ」の小節番号を特定する。
  - プログラマティックなパーサーが、指定範囲の `<measure>` タグを抽出・再構成する。
- **出力**: `workspace/temp/{work}-snippet.musicxml`

### 3. Notation Conversion (`03-notation-conversion.ts`)

- **役割**: MusicXML をプロジェクト標準の ABC 記法に変換する。
- **理由**: MDX 内での管理や、人間による微調整を容易にするため。
- **準規則**: `docs/02_guidelines/score-notation-guidelines.md` に従い、`%%scale` やコードネームを付与。
- **出力**: `workspace/temp/{work}-phrase.abc`

### 4. SVG Rendering (`04-svg-render.ts`)

- **役割**: `Verovio` を使用して、モバイル対応の高品質 SVG を出力する。
- **設定**:
  - `%%staffwidth 100%`
  - `%%scale 0.7` (Mobile optimization)
- **出力**: `workspace/outputs/phrases/{work}.svg`

### 5. Validation (`05-validation.ts`)

- **役割**: 生成物の品質を最終チェックする。
- **チェック項目**:
  - SVG が正常にレンダリング可能か。
  - 音楽的に中途半端な位置で切れていないか（LLMによる音楽的判断）。
  - メタデータ（作品名、小節番号等）との整合性。

## 設計思想

- **Thin Orchestrator**: エージェント（推論）とツール（副作用）を分離し、ワークフロー側が実行順序と冪等性を管理します。
- **Resumability**: 各ステップがファイルを出力するため、エラー発生時に途中から再開可能です。
- **Quality First**: 単なる機械変換ではなく、LLM による「音楽的な文脈の理解」を抽出ステップに組み込みます。
