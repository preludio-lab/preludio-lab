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
- **`MusicXMLValidator`**: DTD/Schema 準拠チェックおよび視認性検証。

### 3. Rendering & Infrastructure Tools

- **`VerovioRenderer`**: モバイル最適化された SVG 生成。
- **`R2BucketTool`**: プレフィックスベースのライフサイクル管理（Move / Publish）。

---

## 状態管理とフィードバック (HITL)

- **Feedback loop**: 人間によるプレビュー確認後、小節範囲の微調整や、Step 2 で出力された別の `PartID` への変更を行い、Step 3 から再実行することが可能です。
- **冪等性の担保**: `phraseId` をキーに管理し、承認されるまで何度でも `staging/` 領域を更新できます。
