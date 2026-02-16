# Musical Example Generator

このツールは、PreludioLab プロジェクト向けに、様々なソースフォーマット（Humdrum, MusicXML）から高品質な楽譜サンプル（SVG）を生成するためのスクリプト・ユーティリティ群です。

## プロジェクト構成

- `scripts/`: データ変換および最適化用 Python スクリプト。
  - `convert_humdrum.py`: Humdrum (`.krn`) ファイルを `music21` を使って MusicXML に変換します。
  - `optimize_musicxml.py`: **コア浄書スクリプト (Core Engraving Script)**。プロフェッショナルな描画のために MusicXML データを整形・最適化します（詳細は `docs/score-engraving-guidelines.md` を参照）。
- `data/`: 検証用データおよび最終出力ファイルの格納場所。
- `temp_source/`: ソースファイルのダウンロードや処理を行う一時作業スペース。

## セットアップ (Setup)

1. **Python 環境**:
   Python 3.10 以上が必要です。

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install music21
   ```

2. **Verovio**:
   `verovio` コマンドラインツールをインストールしてください。
   ```bash
   brew install verovio  # macOS の場合
   ```

## 使用方法 (Usage)

### 楽譜生成（"浄書" ワークフロー）

詳細な手順については、以下のワークフロー・ドキュメントを参照してください：
**[.agent/workflows/score-generation.md](../../.agent/workflows/score-generation.md)**

典型的な実行手順は以下の通りです：

```bash
# 1. 変換 (Convert)
python3 scripts/convert_humdrum.py input.krn temp.musicxml

# 2. 最適化 (Optimize - The Magic Step)
python3 scripts/optimize_musicxml.py temp.musicxml optimized.musicxml

# 3. レンダリング (Render)
verovio optimized.musicxml -o output.svg --font Bravura --scale 35 --spacing-linear 0.2
```

## 浄書ガイドライン (Engraving Guidelines)

視覚的な標準や最適化ルール（フォント、スペーシング、連符処理など）の詳細については、以下を参照してください：
**[docs/score-engraving-guidelines.md](../../docs/score-engraving-guidelines.md)**
