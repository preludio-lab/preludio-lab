# 楽譜浄書ガイドライン (Score Engraving Guidelines)

本文書は、PreludioLab プロジェクトにおける楽譜浄書の標準を確立し、「ワールドクラスのクラシック音楽サイト」にふさわしい品質を保証するためのものです。

## 1. 基本哲学: データ中心の浄書 (Data-Centric Engraving)

私たちは、SVG の手動修正よりも **MusicXML データのプログラムによる最適化** を優先します。これにより、一貫性、意味的な正しさ、およびアクセシビリティが保証されます。

- **Do Not**: SVG を手動で編集しないこと。
- **Do**: MusicXML の属性（`relative-y`, `font-style`, `bracket="no"`）を変更するスクリプトを書くこと。
- **Do**: テキストの最終的なフォントファミリー表示は CSS に委ねること。

## 2. 視覚的標準 (Visual Standards)

### フォント

- **音楽記号**: [Bravura](https://github.com/steinbergmedia/bravura) (SMuFL準拠)。
- **テキスト (指示書き/歌詞)**:
  - SVG内: `font-family` は指定しないか、継承（inherit）させる。
  - CSS内: サイトのデザインシステムのフォント（例: Inter, Roboto）を `svg.verovio-canvas g.dir text` セレクタ等で適用する。
  - **スタイル**:
    - 演奏指示 ("Si deve..."): **Normal** (ローマン体)、イタリックにしない。
    - テンポ指示 ("Adagio"): **Bold**, Normal。
    - 発想記号 ("dolce", "espress."): Italic。

### スペーシングとレイアウト

- **スケール**: Webでの可読性を考慮し、標準スケールは `35` (Verovio単位) とする。
- **線形スペーシング**: `0.2` (デフォルトより詰め気味にし、プロフェッショナルな見た目にする)。
- **非線形スペーシング**: `0.55` (リズムの密度に応じた調整)。
- **段（システム）**: 譜例（Musical Example）としては、原則として **1ファイルにつき1段（1行）** とする。4小節程度が標準的な長さ。

### 表記の詳細

- **連符**: "Simile" 表記を採用する。
  - 最初の連符: 数字を表示、ブラケットは無し。
  - 以降の連符: 数字もブラケットも非表示。
- **大譜表**: 必ずブレース（中括弧）と連結された小節線を持つこと。
- **拍子記号**: 2/2拍子には `cut` (C|) を使用可。
- **パート名**: 抜粋譜例においては、すべてのパート名・略称を非表示にする。

## 3. 実装詳細 (Implementation Details)

### MusicXML の修正

これらの標準を達成するために、`optimize_musicxml.py` スクリプトでは以下の修正を行うのが標準慣行です：

- **垂直位置**: `<direction-type><words relative-y="N">` を使用して、テキストの積み重ね順序（スタッキング）を制御する。
- **要素の非表示**: 機械的な `<metronome>` タグは削除し、代わりに `<words>` でテンポ表記を行う。
- **強弱記号**: 視覚的なノイズを減らすため、冗長な強弱記号（例: 右手と同じ強弱の左手記号）は削除する。

### CSS インテグレーション

生成された SVG は、グローバル CSS を通じてスタイリングされるべきです：

```css
/* テキストをサイトデザインに合わせる */
svg.verovio-canvas g.dir text,
svg.verovio-canvas g.dir tspan {
  font-family: var(--font-primary, sans-serif) !important;
  fill: currentColor;
}

/* 強弱記号は通常 Bravura (音楽フォント) または Serif Italic */
svg.verovio-canvas g.dynam text {
  font-family: serif; /* p, f, m などは伝統的な見た目で */
  font-style: italic;
}
```
