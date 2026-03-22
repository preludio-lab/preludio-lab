# Phrase Generation Workflow (Final Refined I/O & HITL)

本ワークフローは、高品質な譜例（musical phrases）を生成するための、人間とAIが協調するパイプラインです。最新の専門家フィードバックを反映した、極めて堅牢な設計となっています。

## ワークフローの全体像とI/O規格

各ステップは独立したスクリプトとして実装され、先行ステップの結果を元に推論と処理を繋ぎます。

### ステップ一覧

| Step | Script                      | Input                   | Output              | Purpose                              |
| :--- | :-------------------------- | :---------------------- | :------------------ | :----------------------------------- |
| 1    | `01-source-retrieval.ts`    | Composer/Work slugs     | MusicXML (Original) | 元データの取得・正規化 (Humdrum→XML) |
| 2    | `02-metadata-extraction.ts` | MusicXML                | PartID Mapping List | 楽器名とPartID（P1等）の紐付け       |
| 3    | `03-phrase-extraction.ts`   | MusicXML, PartID, Range | Snippet MusicXML    | フレーズ抽出 + 属性注入              |
| 4    | `04-svg-render.ts`          | Snippet MusicXML        | SVG File (Staging)  | 承認前プレビューの生成               |
| 5    | `05-publish.ts`             | Final XML & SVG         | R2 & Sync DB        | 最終承認と公開（移動/アップロード）  |

---

## 専門戦略と高度な処理ロジック

### 1. Source Retrieval & Normalization (Step 1)

- **KernScores (Humdrum) の扱い**:
  - 保守性と後続処理の簡略化のため、`hum2xml` (WASM版推奨) 等を使用して MusicXML へ正規化してから保存します（アプローチA）。
- **R2 Staging**:
  - 取得した元データは `sources/{composer_id}/{work_id}/full.musicxml` に即時保存します。

### 2. PartID Mapping 戦略 (Step 2 & 3)

- **課題**: MusicXML 内の `P1`, `P2` といったIDを LLM が正しく解釈できない。
- **解決策**: Step 2 において MusicXML の `<part-list>` をパースし、`{ PartID: "P1", InstrumentName: "Violin I" }` のようなマッピングを出力します。
- **連携**: LLM はこのリストを参照し、文脈的に適切な `PartID` を Step 3 の入力として指定します。

### 3. R2 ストレージのライフサイクル管理 (Step 4 & 5)

- **分離**: Zero-Cost 運用とキャッシュの整合性を守るため、プレフィックスで状態を分離します。
  - **Draft (Step 4)**: `staging/phrases/{phrase_id}/` (またはローカル `.cache/`)。プレビュー画面がこれを参照。
  - **Public (Step 5)**: `public/phrases/{phrase_id}.svg`。承認されたものだけを移動し、同時に Turso (DB) のステータスを `published` に更新。

---

## 必要とされる専門ツール (Specialized Tools)

### 1. Data Retrieval Tools (Fetchers)

- **`OpenScoreTool` / `KernScoresTool` / `MutopiaTool`**:
  - `KernScoresTool` は `hum2xml` を内包し、MusicXML 形式での出力を保証。

### 2. MusicXML Processing Tools (Deterministic)

- **`MusicXMLProcessor`**:
  - **`getPartMap(xml)`**: PartID と楽器名の一覧を返却。
  - **`extractMeasures(start, end, partId)`**: 正確な切り出し。
  - **`syncAttributes(xml, measure)`**: 最新の属性（Clef/Key/Time）の自動注入。
  - **`optimizeQuality(xml)`**: 視覚的な品質向上のためのクリーンアップ（後続の最適化ルールを参照）。
- **`MusicXMLValidator`**: DTD/Schema 準拠チェックおよび視認性検証。

### 3. Rendering & Infrastructure Tools

- **`VerovioRenderer`**: モバイル最適化された SVG 生成。
- **`PhraseAssetTool`**:
  - R2上の `sources/`、`staging/`、`public/` プレフィックスを使い分け、譜例資産のライフサイクル（保存・移動・公開）を管理する。

---

## 品質向上のための最適化ルール (Quality Optimization)

過去の試作（Beethoven 5th等）での知見に基づき、機械的な印象を排除し、美しくコンパクトな譜例を生成するために以下の処理を `optimizeQuality` で自動実行します。

### (1) 余白の削減とレイアウトのリセット

- **デフォルトレイアウトの削除**: `<defaults>` (全体マージン設定等) や `<credit>` (タイトル/著作権表示等) を削除し、Verovio による自由な動的配置を優先させます。
- **印刷設定の排除**: 各小節内の `<print>` 要素（強制的な改行や位置指定）を削除し、不自然な余白や意図しないシステムブレイクを防止します。

### (2) 記号配置の適正化

- **絶対座標のリセット**: `<direction>`, `<words>`, `<dynamics>` 等に付与されている `@default-x/y` や `@relative-x/y` を削除します。これにより、元のMusicXMLに埋め込まれた不正確な位置情報をリセットし、Verovio の高度な自動配置エンジンに委ねます。
- **強弱記号のタイミング調整**: 小節内の最初の音符に対して、休符などに引きずられている強弱記号を正しい演奏タイミング（音符の直前）へ物理的に移動させ、描画の乱れを防ぎます。
- **テンポ記号の正規化**: テンポ指示を小節の先頭（属性情報の直後）に一貫して配置し、視認性を高めます。

---

## 状態管理とフィードバック (HITL)

- **Feedback loop**: 人間によるプレビュー確認後、小節範囲の微調整や、Step 2 で出力された別の `PartID` への変更を行い、Step 3 から再実行することが可能です。
- **冪等性の担保**: `phraseId` をキーに管理し、承認されるまで何度でも `staging/` 領域を更新できます。
