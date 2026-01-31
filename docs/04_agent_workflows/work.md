# 楽曲マスターデータ生成ワークフロー (Work Master Data Workflow)

**Version: 1.1.0**

## 概要

AIエージェントが楽曲（作品）のマスターデータを追加、または既存のデータを更新するための手順です。
楽曲データは作曲家に紐付いて管理されます。
データはGitHub上のJSONファイルを正（Source of Truth）とし、スクリプトを介してTursoデータベースに同期します。

## ワークフロー

### 1. データの調査

- 指定された楽曲について、作品タイトル、作品番号（Opus/BWVなど）、作曲年、編成、難易度、楽章構成などを調査します。
- **タクソノミー準拠**: 以下のファイルを参照し、`instrumentation`, `genres`, `era` 等は定義済みの値から最適なものを選択してください。
  - `src/domain/shared/musical-instrument.ts`
  - `src/domain/shared/musical-genre.ts`
  - `src/domain/shared/musical-era.ts`

### 2. JSONファイルの作成/更新

- `data/works/<composer-slug>/<work-slug>.json` を作成または編集します。
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

1. **タクソノミー**: `instrumentation`, `genres`, `era` 等の値は `src/domain/shared/` 内の定義ファイルに存在する `slug` から選ぶこと。勝手な値を作成しない。
2. **i18n**: タイトルや解説は必ず日本語(`ja`)と英語(`en`)の両方を記述すること。
3. **カタログ番号**: `catalogues` で `isPrimary: true` となるカタログ（Op.やBWV等）を必ず1つ指定すること。
4. **楽章管理**: `parts` には `sortOrder` を設定し、楽曲の構成を正確に記述すること。
5. **トレーサビリティ**: `_generatorMeta` に以下の情報を必ず含めること：
   - `sourceRefs`: 調査に使用した出典URL（IMSLP, Wikipedia等）のリスト。
   - `confidenceScore`: 生成したデータの正確性に対する自己採点（0.0〜1.0）。
   - `promptVersion`: 本ドキュメント冒頭の **Version** を指定。

## 注意事項

- `composerSlug` が既存の作曲家マスターデータと一致している必要があります。
- `parts`（楽章）には、`sortOrder` を設定して正しい順序を維持してください。
- 高度なメタデータ（調性、拍子、テンポ等）は、可能な限り正確に入力してください。これらは後の分析エージェントのインプットとなります。
