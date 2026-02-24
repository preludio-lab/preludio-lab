# AI Agent Tools 仕様書

エージェントが特定のタスク（データ取得、保存など）を実行するために使用する具体的なツール群を定義します。

## 概要

AIエージェントが外部環境（API、データベース、ファイルシステム等）と連携するための具体的な機能群（ツール）を定義・実装するディレクトリです。

## 目的

1. データ取得（検索、API通信）や保存（DB書き込み）などの各タスクをカプセル化し、エージェントへ提供する。
2. エージェントがコンテキストに応じて自律的に最適なツールを選択できるように、各ツールの責務と入出力を明確に定義する。

## 実装方針

- **インターフェースの統一**: 全てのツールは `core/README.md` に沿って `AgentTool` インターフェースを実装し、I/O規格を統一する。
- **堅牢な外部通信**: 外部APIへのリクエストは `ResilientFetcher` 経由で行い、レート制限の回避やエラー発生時の自動リトライを担保する。
- **セキュアなクレデンシャル管理**: センシティブな情報（GitHub Token等）はコードに含めず、常に `.env.local` から安全に読み込む。

## ツール一覧

### 1. GoogleSearchTool (Grounding 統合)

Gemini の **Google Search retrieval (Grounding)** 機能を `BaseAgent` のオプションとして利用します。

- **目的**: 最新情報や事実確認のための検索。
- **実装**: `BaseAgent` 実行時に `googleSearchRetrieval` を有効化することで、エージェントが自律的に検索結果をコンテキストとして利用します。
- **メリット**: 追加の検索 API キーが不要で、Zero-Cost 戦略に合致し、レスポンスの正確性が向上します。

### 2. WikipediaTool (`tools/web/wikipedia.tool.ts`)

Wikipedia (MediaWiki API) からエンティティの正確なマスタデータや Infobox 情報を抽出します。

- **目的**: 作曲家の生没年、作品番号、楽曲の歴史的背景といった「正確な構造化マスタデータ」の確実な取得。
- **実装**: `ResilientFetcher` 経由で MediaWiki Action API にアクセスし、パース済みの JSON データを取得・整形する。
- **メリット**: `GoogleSearchTool` (Grounding) がRAG的な文書検索に近いのに対し、こちらはキー・バリュー形式の構造化データを低コストかつ安定して取得できるため、マスタデータ収集の要となる。

### 2. GitHubTool (`tools/web/github.tool.ts`)

GitHub 上で公開されているリソースを安全に取得します。

- **目的**: `OpenScore` 等の外部プロジェクトが管理する MusicXML や演奏データの取得。
- **実装**: GitHub Rest API または Raw Content Fetch。
- **メリット**: 未来の「譜例量産」ワークフローの基盤となる。

### 4. TursoUpsertTool (`tools/db/turso-upsert.tool.ts`)

取得・生成したデータを Turso データベースへ永続化します。

- **目的**: エージェントによる DB 書き込み。
- **接続方針**:
  - メインアプリの Drizzle Schema を直接インポートして使用。
  - **前提条件**: `upsert` を正常に動作させるため、メインアプリ側の Schema で `UNIQUE` 制約（作曲家名、作品番号等の組み合わせ）が適切に定義されている必要があります。
  - `upsert` (ON CONFLICT UPDATE) ロジックにより、重複登録を防止し情報を最新に保つ。
  - **バルク処理（バッチ実行）の標準化**: 大量データ（数万件規模の楽曲データ等）を扱うため、1件ずつのUpsertではなく、配列（バルクデータ）を入力スキーマ `execute(input: I[])` で受け取り、1度のトランザクションで複数件を効率的に処理する設計を標準とする。

## 共通ルール

- 全てのツールは `core/README.md` で定義された `AgentTool` インターフェースを実装する。
- 外部通信が発生する場合は、必ず `ResilientFetcher` を使用する。
- センシティブな情報（GitHub Token 等）は `.env.local` で管理する。
