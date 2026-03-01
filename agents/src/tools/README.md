# AI Agent Tools 仕様書

エージェントが特定のタスク（データ取得、保存など）を実行するために使用する具体的なツール群を定義します。

## 概要

AIエージェントが外部環境（API、データベース、ファイルシステム等）と連携するための具体的な機能群（ツール）を定義・実装するディレクトリです。

## 目的

1. データ取得（検索、API通信）や保存（DB書き込み）などの各タスクをカプセル化し、エージェントへ提供する。
2. エージェントがコンテキストに応じて自律的に最適なツールを選択できるように、各ツールの責務と入出力を明確に定義する。

## 実装方針

- **インターフェースの統一**: 全てのツールは `core/README.md` に沿って `AgentTool` インターフェースを実装し、I/O規格を統一する。
- **堅牢な外部通信**: 外部APIへのリクエストは `ResilientFetcher` (Axiosベース) またはネイティブの `createResilientFetch` を使用し、レート制限の回避やエラー発生時の自動リトライを担保する。
- **セキュアなクレデンシャル管理**: センシティブな情報（GitHub Token等）はコードに含めず、常に `.env.local` から安全に読み込む。
- **単方向のデータフロー**: AIエージェントはデータベース（Turso等）へ直接書き込み（Upsert）を行わず、Single Source of Truth としてローカルのJSONファイルへの書き出しのみを担当する。DBへの同期は別途CI/CD等に委ねることで、状態の二重管理を防ぐ。

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

### 3. GitHubTool (`tools/web/github.tool.ts`)

GitHub 上で公開されているリソースを安全に取得します。

- **目的**: `OpenScore` 等の外部プロジェクトが管理する MusicXML や演奏データの取得。
- **実装**: GitHub Rest API または Raw Content Fetch。
- **メリット**: 未来の「譜例量産」ワークフローの基盤となる。

### 4. AgentDataWriterTool (`tools/agent-data-writer.tool.ts`)

AIエージェントが収集・推論したデータ（マスタデータ等）を、直接データベースへ書き込む前にファイルシステム（Gitリポジトリ管理下等）へ JSON 形式で保存します。

- **目的**: データのSingle Source of Truth（唯一の情報源）の担保と、状態の二重管理の防止。
- **実装**: 指定されたZodスキーマ（例: `ComposerMasterSchema`）に従ってデータを検証し、生成時間や使用モデル名を含むメタデータ（`_generatorMeta`）を自動付与して指定ディレクトリ（例: `data/composers/`）に `{slug}.json` として保存する。
- **運用連携**: このツールによって出力されたローカルのJSONデータをトリガーとして、後続のCI/CDパイプラインやスクリプトがデータベース（Turso等）へのバルク Upsert処理を担うアーキテクチャとする。

## 共通ルール

- 全てのツールは `core/README.md` で定義された `AgentTool` インターフェースを実装する。
- 外部通信が発生する場合は、必ず専用の Resilient クライアントを使用する。
- センシティブな情報（GitHub Token 等）は `.env.local` で管理する。
