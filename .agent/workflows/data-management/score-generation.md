---
description: ソースデータから高品質な楽譜SVGを生成する手順書
---

# 楽譜生成ワークフロー (Score Generation Workflow)

本ワークフローは、音楽ソースデータ（Humdrum `**kern` 等）を PreludioLab ウェブサイト用の高品質な SVG 画像に変換する手順を定めたものです。

## 前提条件

- **Python 3.10+** (`music21` ライブラリ必須)
- **Verovio CLI** (インストール済みでパスが通っていること)
- **Node.js** (プロジェクトツール用)

## ワークフィロー手順

### 1. ソースデータの取得

ソースデータ（通常 `.krn` または `.musicxml`）を取得し、一時作業ディレクトリ（例: `tools/musical-example-generator/temp_source/`）に配置します。

### 2. MusicXMLへの変換

ソースが MusicXML 形式でない場合、変換を行います。

```bash
python scripts/convert_humdrum.py <input.krn> <output.musicxml>
```

### 3. プログラマティックな浄書（最適化）

**最重要ステップ**: 生成された生の MusicXML をそのままレンダリングに使用してはいけません。最適化スクリプトを使用してデータを整形し、プロフェッショナルな品質にします。

```bash
python scripts/optimize_musicxml.py <input.musicxml> <optimized.musicxml>
```

**主な最適化内容:**

- **大譜表の結合**: ピアノ譜として適切なブレース（中括弧）と小節線の連結を強制します。
- **連符表記の簡素化 (Simile)**: 数字の「3」は最初の1つだけ表示し、以降の数字とすべてのブラケット（括弧）を非表示にします。
- **レイアウト制御**: 指定した小節数（例: 4小節）で切り出し、1段（1行）に収まるよう強制します。
- **テキストと意味論**:
  - 指示書きの垂直位置（`relative-y`）を調整し、衝突を防ぎます（例: Adagioを上に、詳細指示を下に）。
  - 冗長な強弱記号（例: 重複する左手のpp）を削除します。
  - フォントスタイル（Normal/Italic）を明示し、CSSでの制御を容易にします。

### 4. SVGレンダリング (Verovio)

最適化された MusicXML を、一貫した設定で SVG にレンダリングします。

```bash
verovio <optimized.musicxml> -o <final.svg> \
    --font Bravura \
    --scale 35 \
    --page-width 2500 \
    --spacing-linear 0.2 \
    --spacing-non-linear 0.55 \
    --slur-curve-factor 1.2 \
    --header "none" --footer "none" \
    --breaks "none"
```

### 5. 品質検証 (Validation)

出力された SVG を確認します：

- [ ] **衝突**: 指示書きのテキストなどに重なりはないか？
- [ ] **連符**: Simile表記（最初だけ表示）になっているか？
- [ ] **フォント**: テキストのスタイル（太字/イタリック/標準）は正しいか？
- [ ] **レスポンシブ**: ブラウザ上で適切にスケーリングされるか？

## トラブルシューティング

- **テキストの重なり**: `optimize_musicxml.py` 内の `relative-y` 値を調整してください。
- **スペーシングの不具合**: Verovio オプションの `--spacing-linear`（詰まり具合）や `--spacing-non-linear`（リズムスペーシング）を微調整してください。
