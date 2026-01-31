# 作曲家マスターデータ生成ワークフロー (Composer Master Data Workflow)

**Version: 1.1.0**

## 概要

AIエージェントが新しい作曲家のマスターデータを追加、または既存のデータを更新するための手順です。
データはGitHub上のJSONファイルを正（Source of Truth）とし、スクリプトを介してTursoデータベースに同期します。

## ワークフロー

### 1. データの調査と肖像画の取得

- 指定された作曲家について、フルネーム、生没年月日、国籍、代表的な楽器・ジャンルなどを調査します。
- **タクソノミー準拠**: 以下のファイルを参照し、`representativeInstruments`, `representativeGenres`, `era` 等は定義済みの値から最適なものを選択してください。
  - `src/domain/shared/musical-instrument.ts`
  - `src/domain/shared/musical-genre.ts`
  - `src/domain/shared/musical-era.ts`
- **肖像画の選定と法的リスク回避**:
  - 法的リスクを最小化するため、原則として**パブリックドメイン（著作権消滅済み）**の画像のみを使用します。
  - 信頼できるソースとして **Wikipedia (Wikimedia Commons)** を優先的に参照してください。
  - Wikimedia Commons の画像詳細ページで、ライセンスが `Public Domain` または `CC0` であることを確認した上で、高解像度な画像URL（`upload.wikimedia.org/...`）を取得します。

### 2. 肖像画の処理とアップロード

- 以下のコマンドを使用して、画像を取得・最適化し、Cloudflare R2（CDN）にアップロードします。
- このコマンドは、標準サイズ（1600px）とモバイル向けSmallサイズ（300px）の2種類を自動生成します。
- すでに画像が存在する場合はスキップされます。強制的に上書きする場合は `--force` を付けてください。
  ```bash
  pnpm tsx scripts/composer/process-portrait.ts <slug> "<image_url>" [--force]
  ```
- 実行後に出力される `RESULT_PATH` (CDN URL) を、JSONの `portrait` フィールドに使用します。

### 3. JSONファイルの作成/更新

- `data/composers/<slug>.json` を作成または編集します。
- スキーマに従い、全ての必須フィールドを埋めます。
- `portrait` には前ステップで取得したパスを設定します。

### 4. バリデーション

- 以下のコマンドを実行し、データ構造と型が正しいことを確認します。
  ```bash
  pnpm run validate:composers data/composers/<slug>.json
  ```
- **エラー時の対応**:
  - `FAILED` と表示された場合は、出力される詳細なエラーメッセージ（Zodのエラー内容）を確認し、JSONファイルを修正してください。
  - よくある原因: タクソノミーに存在しない値の使用、必須項目の不足、型ミスの指摘など。
  - **バリデーションが OK になるまで、決して次のデータベース同期ステップへ進んではいけません。**

### 5. データベースへの同期

- **バリデーションが成功したことを確認した上で**、以下のコマンドを実行してJSONファイルをデータベースに反映します。
  ```bash
  pnpm run seed:composers data/composers/<slug>.json
  ```

### 6. Gitへのコミット

- 作成・更新したJSONファイルをリポジトリにコミットします。

## スキーマ定義

JSONデータの構造は、以下のNext.jsソースコード内のZodスキーマを正規の定義とします。

- **定義ファイル**: `src/application/composer/master/composer-master.schema.ts`
- **主要な型**: `ComposerMaster`

## AIエージェント向けガイドライン (プロンプト用要約)

作曲家データの作成・更新時は以下のルールを厳守してください：

1. **画像ソース**: 肖像画は必ず Wikipedia/Wikimedia Commons からパブリックドメインのものを取得すること。
2. **タクソノミー**: `representativeInstruments` 等の値は `src/domain/shared/` 内の定義ファイルに存在する `slug` から選ぶこと。勝手な値を作成しない。
3. **i18n**: 名前や伝記は必ず日本語(`ja`)と英語(`en`)の両方を記述すること。
4. **ID**: 新規作成時は UUID v7 を生成し、更新時は既存の ID を維持すること。
5. **トレーサビリティ**: `_generatorMeta` に以下の情報を必ず含めること：
   - `sourceRefs`: 調査に使用した出典URL（Wikipedia, IMSLP等）のリスト。
   - `confidenceScore`: 生成したデータの正確性に対する自己採点（0.0〜1.0）。
   - `promptVersion`: 使用したプロンプトの識別子（本ドキュメント冒頭の **Version** を指定）。

## 注意事項

- `slug` はURLに使用されるため、重複のない一意な小文字の英数字（ハイフン区切り）である必要があります。
- `portrait` は原則として `https://cdn.preludiolab.com/composers/<slug>/images/portrait.webp` の形式になります。
