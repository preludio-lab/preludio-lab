---
description: 楽曲ソース（GitHub/KernScores）を調査しマニフェストに追加する自動ワークフロー
---

# 楽曲ソース自動調査ワークフロー (@score-research)

このワークフローは、指定された作曲家・楽曲に基づき、最適なデジタルスコア（MusicXML/Humdrum）のソースをパブリックリポジトリから特定し、`data/score-manifest.yaml` に追記します。

## 1. 前提条件 (Prerequisites)

- **Input**:
  - `composer_name`: 作曲家名（例: Wolfgang Amadeus Mozart）
  - `work_title`: 楽曲タイトル（例: Piano Sonata No. 11）
  - `part_title` (Optional): 楽章・パーツ名（例: 1st movement）
- **Workspace**: `agents/workspace/score/` を一時ファイル領域として使用します。

## 2. 実行プロセス (Execution Process)

各ステップで失敗した場合は、最大 3 回までリトライを行ってください。

### Step 1: 初期化とセッション管理

- `agents/workspace/score/research-session.json` を作成（または読み込み）し、現在のステータスを記録します。
  ```json
  {
    "input": { "composer": "...", "work": "..." },
    "status": "researching",
    "attempts": 0,
    "found_sources": []
  }
  ```

### Step 2: リポジトリ・サーチ (Research)

- `search_web` を使用し、以下の優先順位で検索を行います。
  1.  **GitHub**: `craigsapp`, `humdrum-tools`, `openscore`, `musedata` 等の有名リポジトリ。
  2.  **KernScores**: CGI経由のダウンロードURLやリポジトリパスの特定。
- 検索キーワード例: `"{composer_name}" "{work_title}" github scores musicxml kern`

### Step 3: URL 検証と不変性のロック (Verify & Lock)

- 見つかったリポジトリに対し、以下の検証を行います。
  - **ファイル存在確認**: 該当する `.mxl`, `.xml`, `.krn` ファイルが存在するか。
  - **コミットハッシュの取得**: `git ls-remote {repo_url} HEAD` を実行（または GitHub API 相当の調査）し、現在の **40 文字のフルコミットハッシュ**を特定します。
  - **Raw URL 生成**: 決定論的にファイルを取得できる Raw URL を構成します。

### Step 4: マニフェストへの登録 (Registration)

- `data/scores/repositories.yaml` を確認し、リポジトリが未登録の場合は以下の情報を追記します。
  - リポジトリ ID (owner/name)
  - 提供内容の要約（例: "Mozart Piano Concertos"）
  - ライセンス情報
- `data/scores/manifest.yaml` を読み込み、重複がないことを確認した上で、新しい楽曲エントリを追記します。
- スキーマ（`composer_slug`, `work_slug`, `repository_owner`, `repository_name`, `commit_hash`, `file_path`, `format`, `license` 等）を厳格に遵守してください。

### Step 5: 最終疎通確認 (Final Check)

- 追記したエントリの Raw URL に対し、`curl -I` 等で正常にアクセス可能（200 OK）か最終確認を行います。

## 3. エンタープライズ品質のための制約 (Quality Constraints)

- **リトライ制御**: ネットワークエラーや検索結果ゼロの場合、キーワードを変えて最大 3 回まで再試行してください。
- **証跡の残存**: 各リトライの結果やエラー内容は `research-session.json` に追記し、中断時に次回のセッションで参照できるようにします。
- **ライセンスの確認**: ファイルヘッダーやリポジトリの `LICENSE` ファイルを確認し、可能な限り `CC0`, `CC-BY` 等のライセンス情報を付記してください。不明な場合は `unknown` とし、コメントを残してください。
- **ログ出力**: `consola` または標準出力を通じて、現在のステップと発見した URL を逐次報告してください。

## 4. 異常系への対応

- **ソースが見つからない場合**: 調査したリポジトリリストと「見つからなかった理由（例: 非公開、PDFのみ等）」を報告し、手動調査（Step 4.2: Abnormal Path）へエスカレーションしてください。
- **整合性エラー**: YAML の文法エラーや重複が発生した場合は、書き込みをロールバックしてエラー内容を報告してください。
