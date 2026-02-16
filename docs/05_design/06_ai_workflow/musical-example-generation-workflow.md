# AI譜例生成ワークフロー (AI Musical Example Generation Workflow)

PreludioLabの根幹である「譜例と音源を活用した没入感」を実現するための、信頼性が高くスケーラブルな譜例生成ワークフローです。

## 基本方針

- **対象**: 楽曲のイメージを決定づける代表的な主題（数小節）をピックアップします。
- **フォーマット**: 原則として**MusicXML**形式（`.musicxml` または `.xml`）を採用します。
- **レンダリング**: 事前に**Verovio**を用いたSVG生成（SSG変換）を行い、ブラウザでの描画負荷を最小化します。
- **データソース**: ゼロベースでの生成は避け、信頼できるオープンデータリポジトリを参照・加工するアプローチを取ります。

---

## 1. 原典MusicXMLの取得 (Acquisition)

信頼できるリポジトリから対象楽曲のMusicXMLを取得し、アーカイブします。

- **ソース**: OpenScore, KernScores, IMSLP (MusicXML available ones)
- **保存先**: GitHub (source-of-truth) または Cloudflare R2 (raw data)
- **アクション**:
  1.  対象楽曲のMusicXML URLを特定。
  2.  ファイルをダウンロード。
  3.  `data/sources/{composer}/{work}/full_score.musicxml` のような体系的なパスで保存。

## 2. 聴きどころの選定 (Selection)

記事で紹介する「聴きどころ（Musical Highlights）」を特定します。

- **入力**: 楽曲分析テキスト、または人間による指定。
- **出力**: 抽出定義リスト（YAML/JSON）。
  ```yaml
  - slug: 'theme-1'
    description: '第1主題'
    measures: '1-4'
    part: 'Piano'
  ```

## 3. 聴きどころの抜粋と加工 (Extraction & Processing)

取得したMusicXMLから必要な箇所を切り出し、Web表示用に加工します。

- **ツール**: `tools/musical-example-generator` (TypeScript: `verovio`, `fast-xml-parser`)
- **プロセス**:
  1.  **Trimming**: 定義された小節範囲（例: 1-4小節）を TypeScript で XML 操作を行い、部分的なMusicXMLを生成。
  2.  **Cleaning**: 表示に不要な要素（非表示のパート、過剰なメタデータ）を削除。
  3.  **Rendering**: `verovio` (WASM/npm) を使用してMusicXMLをSVGに変換。
  4.  **Optimization**: SVGをWeb表示用に最適化。
  5.  **Distribution**: 生成されたMusicXMLとSVGをCloudflare R2へアップロードし、Turso (DB) にメタデータを登録。

## 4. 検証 (Verification)

本ワークフローの正当性を検証するため、以下の楽曲でE2Eテストを実施します。

- **対象**: ベートーヴェン：ピアノソナタ第14番「月光」第1楽章 (Beethoven: Piano Sonata No. 14 "Moonlight", 1st Movement)
- **検証項目**:
  - OpenScore等からの取得可否。
  - 指定小節（冒頭の3連符など）の正確なトリミング。
  - VerovioによるSVG生成の品質。
  - プレビューツールでのSVG目視確認。

---

## 5. 実装ディレクトリ構成

`tools/musical-example-generator` に TypeScript ベースのツール群を配置します。

- `package.json`: `verovio`, `fast-xml-parser`, `zod`
- `src/index.ts`: ワークフロー実行スクリプト
- `src/lib/`: ユーティリティ（Fetcher, Slicer, Renderer）
