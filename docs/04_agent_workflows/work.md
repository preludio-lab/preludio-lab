# 楽曲マスターデータ生成ワークフロー (Work Master Data Workflow)

**Version: 1.2.0**

## 概要

AIエージェントが楽曲（作品）のマスターデータを追加、または既存のデータを更新するための手順です。
楽曲データは作曲家に紐付いて管理されます。
データはGitHub上のJSONファイルを正（Source of Truth）とし、スクリプトを介してTursoデータベースに同期します。

## ワークフロー

### 1. データの調査

- 指定された楽曲について、作品タイトル、作品番号（Opus/BWVなど）、作曲年、編成、難易度、楽章構成、拍子 (Time Signature)、印象評価（Impression Dimensions）などを調査します。

- **タクソノミー準拠**: 以下のファイルを参照し、`instrumentation`, `genres`, `era`, `tags` 等は定義済みの値から最適なものを選択してください。
  - `docs/01_specs/taxonomy.yaml` (Tags, Genres, Eras)
  - `src/domain/shared/musical-instrument.ts`
  - `src/domain/shared/musical-genre.ts`
  - `src/domain/shared/musical-era.ts`
  - `src/domain/shared/musical-tag.ts` (新規実装予定・既存のIDsを参照)
  - `docs/01_specs/taxonomy.yaml` (Impression Scales)

### 2. JSONファイルの作成/更新

- `data/works/<composer-slug>/<work-slug>.json` を作成または編集します。
- 拍子 (Time Signature): 各楽章(`parts`)の`timeSignature`に必ず設定してください。
  - `numerator`: 分子 (例: 4)
  - `denominator`: 分母 (例: 4)
  - `displayString`: 必要であれば伝統的表記 (例: "C", "Alla Breve") や特殊な表記。通常は省略可。
- スラッグ命名規則:
  - ケバブケースを使用。
  - 基本形: `[genre-or-title]-[number]` (例: `piano-concerto-no-20`)
  - 番号がない場合は `[genre-or-title]` のみ。
- スキーマに従い、全ての必須フィールドを埋めます。
- インフラ（R2）に配置予定のアセット（音源、譜例）がある場合は、プロジェクトのパス規則に従ってプレースホルダを設定します。

### 3. バリデーション

- 以下のコマンドを実行し、データ構造と型が正しいことを確認します。
  ```bash
  pnpm run validate:works data/works/<composer-slug>/<work-slug>.json
  ```
- **エラー時の対応**:
  - `FAILED` と表示された場合は、出力される詳細なエラーメッセージ（Zodのエラー内容）を確認し、JSONファイルを修正してください。
  - **バリデーションが OK になるまで、決して次のデータベース同期ステップへ進んではいけません。**

### 4. データベースへの同期

- **バリデーションが成功したことを確認した上で**、以下のコマンドを実行してJSONファイルをデータベースに反映します。
  ```bash
  pnpm run seed:works data/works/<composer-slug>/<work-slug>.json
  ```

### 5. Gitへのコミット

- 作成・更新したJSONファイルをリポジトリにコミットします。

## スキーマ定義

JSONデータの構造は、以下のNext.jsソースコード内のZodスキーマを正規の定義とします。

- **定義ファイル**: `src/application/work/master/work-master.schema.ts`
- **主要な型**: `WorkMaster`

## AIエージェント向けガイドライン (プロンプト用要約)

楽曲データの作成・更新時は以下のルールを厳守してください：

1. **タクソノミー**: `instrumentation`, `genres`, `era` 等の値は `src/domain/shared/` 内の定義ファイルまたは `taxonomy.yaml` に存在する `id` から選ぶこと。勝手な値を作成しない。
   - **Eraの選定（重要）**: 作曲家のEraを単に継承せず、**その作品自体の音楽的スタイル**に最も適したEraを選択すること。特に過渡期の作品（例：ベートーヴェン中期・後期）については、革命的・ロマン的な性質が強ければ `early-romantic` を積極的に採用し、データの解像度を高めること。
2. **タグ付け**: `taxonomy.yaml` の `tags` セクションを参照し、作品全体(`Work`)および各楽章(`WorkPart`)に適切なムードや情景タグを付与すること。
3. **印象評価 (Impression Dimensions)**: `taxonomy.yaml` の `impression_scales` を参照し、`impressionDimensions` オブジェクト（6軸スコア）を**Workおよび各WorkPartに対して必ず生成すること**。
   - 作品全体の値と、各楽章の値は異なっていても良い（むしろ推奨）。
   - 各軸のスコア（-10〜+10）は、楽曲のキャラクターを分析して慎重に決定すること。
4. **i18n (7ヶ国語対応)**:
   - 全ての多言語フィールド（タイトル、解説等）において、以下の7つのロケールを必ず含めること：
     - `en` (English), `de` (Deutsch), `fr` (Français), `it` (Italiano), `es` (Español), `ja` (日本語), `zh` (中文)
   - **一貫性の確保プロセス**: グローバルSEOと一貫性のため、以下のプロセスで生成すること：
     1. **英語 (en)** を正（Master）として、内容を完全に確定させる。
     2. 確定した英語の内容をベースに、日本語(ja)を含む他言語へ翻訳・展開する。
5. **カタログ番号**: `catalogues` で `isPrimary: true` となるカタログ（Op.やBWV等）を必ず1つ指定すること。
6. **楽章管理**: `parts` には `order` を設定し、楽曲の構成を正確に記述すること。
7. **トレーサビリティ**: `_generatorMeta` に以下の情報を必ず含めること：
   - `sourceRefs`: 調査に使用した出典URL（IMSLP, Wikipedia等）のリスト。
   - `confidenceScore`: 生成したデータの正確性に対する自己採点（0.0〜1.0）。
   - `promptVersion`: 本ドキュメント冒頭の **Version** を指定。

## 注意事項

- `composerSlug` が既存の作曲家マスターデータと一致している必要があります。
- `parts`（楽章）には、`order` を設定して正しい順序を維持してください。
- 高度なメタデータ（調性、拍子、テンポ等）は、可能な限り正確に入力してください。これらは後の分析エージェントのインプットとなります。
