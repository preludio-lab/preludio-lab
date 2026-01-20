# AI譜例生成ワークフロー (AI Musical Example Generation Workflow)

PreludioLabの根幹である「譜例と音源を活用した没入感」を実現するための、信頼性が高くスケーラブルな譜例生成ワークフローです。

## 基本方針

- **対象**: 楽曲のイメージを決定づける代表的な主題（数小節）をピックアップします。
- **フォーマット**: 原則として**MusicXML**形式（`.musicxml` または `.xml`）を採用します。
- **レンダリング**: 事前に**Verovio**を用いたSVG生成（SSG変換）を行い、ブラウザでの描画負荷を最小化します。
- **データソース**: ゼロベースでの生成は避け、信頼できるオープンデータリポジトリを参照・加工するアプローチを取ります。

---

## 1. 信頼できる楽譜リポジトリの選定と取得フロー

MusicXMLデータの取得元としては、以下の優先順位で選定します。データの「構造化レベル」が品質に直結するためです。

| ソース         | 形式             | 活用戦略                                                                                                   |
| :------------- | :--------------- | :--------------------------------------------------------------------------------------------------------- |
| **OpenScore**  | MusicXML / .mscz | **最優先**。全てがデジタルデータ化されており、MusicXMLとしての精度が極めて高いです。                       |
| **KernScores** | .krn (Humdrum)   | **準優先**。数千曲が構造化されています。`music21`を使って高品質なMusicXMLへ変換して利用します。            |
| **IMSLP**      | PDF / MusicXML   | MusicXMLが提供されている楽曲を優先。PDFのみの場合はOMR（光学認識）または最終手段としてAI生成を検討します。 |

### データ取得とフォールバック (Data Acquisition & Fallback)

1.  **リポジトリ検索と特定**:
    目的の楽曲（および楽章）に合致するMusicXMLを上記ソースから検索します。
2.  **成功時 (MusicXML発見)**:
    ファイルをダウンロードし、次の「分析・抽出」ステップへ進みます。
3.  **失敗時 (フォールバック)**:
    - **PDF OMR**: IMSLP等の高品質なPDFから、Audiveris等のOMRツールを用いてMusicXMLを生成します。
    - **AI Draft Generation**: 構造化データが見つからない場合、AIモデルが楽曲解説の小節番号情報を元に、代表的な旋律をMusicXML形式でドラフト生成します（※この場合、人間による音楽的妥当性の検証が必須となります）。

---

## 2. 楽曲の「聴きどころ」自動選定ワークフロー

Geminiのマルチモーダルな理解力を活かし、必要な箇所のみを抽出する「自動トリミング・パイプライン」を構築します。

1.  **ハイライト箇所の特定**
    AIモデル（Gemini 3等）に楽曲解説（または構造分析テキスト）を読み込ませ、以下の処理を行います。
    - **スラッグ生成**: 各ハイライト箇所を一意に識別するスラッグ（例: `1st-theme`, `transition`）を生成します。これらは`Work`または`WorkPart`の子要素として管理されます。
    - **小節番号の特定**: 重要な主題（Theme）が開始・終了する**「小節番号（Measure Number）」**（例: 第1楽章 第1主題 1-4小節）を特定します。
      - _Note_: 小節番号の精度は極めて重要です（1小節のズレでも音楽的な意味が変わるため）。AIによる推論のみに依存せず、プログラムによる検証やHuman-in-the-loop（人が最終確認する）等の品質担保の仕組みを考慮します。

2.  **MusicXMLスライサー (GitHub Actions)**
    Pythonライブラリの `music21` 等を実行環境で動かし、フルスコアのMusicXMLから指定された小節範囲だけをプログラム的に「抜き出し（Slice）」、新しい譜例用MusicXMLファイルとして書き出します。

3.  **保存とメタデータの付与**
    抽出した抜粋MusicXMLおよびビルド時に生成されたSVGを、管理リポジトリおよび**Cloudflare R2**へ配備します。同時に、作品番号、楽章、パート情報などのメタデータを付与します。

---

## 3. 楽譜レンダリング戦略：VerovioによるSSG変換

Web表示のパフォーマンス（Core Web Vitals）と品質を両立させるため、クライアントサイドでのレンダリングではなく、ビルド時の変換を推奨します。

### 採用技術：Verovio (WebAssembly)

- **プロセス**: Next.jsのビルド時、またはGitHub ActionsのCIパイプライン中で、**Verovio**を使用してMusicXMLを**SVG**に変換します。
  - _Optimization_: 表示に不要なメタデータをストリップ（削除）する処理を挟むことで、SVGサイズを最適化します。
- **メリット**:
  - **爆速の表示**: ランタイムでのJavaScript実行（Verovioのロードとパース）が不要になり、LCPが劇的に改善します。
  - **高精細**: ベクター形式のため、高解像度ディスプレイやズーム操作でも劣化しません。
  - **SEO**: 歌詞や発想記号などのテキスト情報がSVG内に保持されるため、検索エンジンのインデックス対象となります。

---

## 4. 実装ディレクトリ構成

本ワークフローは、Webアプリケーション（Next.js）やエッジワーカー（Cloudflare Workers）とは性質が異なる「バッチ処理/ビルドツール」であるため、独立したディレクトリで管理します。

- **配置場所**: `tools/musical-example-generator`
- **理由**:
  - `src/` (Next.js): アプリケーションコードとツールチェーンを疎結合に保つため分離。
  - `workers/` (Cloudflare Workers): 現在 `cdn-proxy` 等のエッジコードが含まれており、Python環境などを必要とする本ツールとは実行環境が異なるため分離。

---

## 5. ストレージ戦略：Cloudflare R2への保存

生成されたアセットは、以下の役割分担に基づいて保存されます。

- **GitHub Repository**:
  - マスタデータとしてのフルスコア（または外部リポジトリへの参照URL）
  - 生成用スクリプト、メタデータ定義
- **Cloudflare R2 (`preludiolab-storage`)**:
  - `scores/{work_slug}/{part_slug}/{highlight_slug}.xml`: 抽出された小節単位のMusicXML抜粋。
  - `scores/{work_slug}/{part_slug}/{highlight_slug}.svg`: Web表示用に最適化されたレンダリング結果。
  - **メリット**: Next.jsのビルドプロセスから重いバイナリ/XMLファイルを分離し、グローバルなCDN経由での高速配信（`cdn-proxy` 経由）を実現します。

## 5. 総合的なユーザー体験と保守運用性

### MDXでの実装イメージ (Antigravity)

記事コンテンツ（MDX）内では、以下のようなカスタムコンポーネントを用いて譜例を埋め込みます。

```tsx
<MusicalExample
  src="/scores/beethoven/symphony5/mvt1-theme1.xml"
  caption="運命の動機：力強い同音反復から始まる"
  audio={{
    recordingSourceId: 'rec_symphony5_karajan',
    startSeconds: 0,
    endSeconds: 15, // RecordingSegmentの定義に基づく
    isDefault: true,
  }}
/>
```

このコンポーネントは、ビルド時に生成されたSVGを表示し、クリック（またはタップ）することで連携するYouTubeプレイヤーの該当時間（`0:15`）から再生を開始するインタラクションを提供します。

### 保守・多言語対応

- **バージョン管理**: MusicXMLはテキストベースであるため、Gitでの差分管理が容易です。
- **多言語展開**: MusicXML内の楽器名や演奏指示をAIモデルで翻訳し、言語別（`ja`, `en`, etc.）のSVGを生成するワークフローへの拡張も可能です。

```mermaid
graph TD
    A[Music Repositories] -->|Search & Fetch| B{Found MusicXML?}
    B -->|Yes| C[Full Score MusicXML]
    B -->|No| D[PDF OMR / AI Draft]
    D --> C
    C -->|AI Analysis| E(Identify Measure Numbers)
    E -->|music21 Slicer| F[Snippet MusicXML]
    F -->|Verovio (CI/Build)| G[Optimized SVG]
    G -->|Store| H[Cloudflare R2]
    H --> I[Web Application (MDX)]
    I -->|Click| J[Audio Playback]
```
