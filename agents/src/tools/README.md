# AI Agent Tools 仕様書

エージェントが特定のタスク（データ取得、保存など）を実行するために使用する具体的なツール群を定義します。

## ツール一覧

### 1. GoogleSearchTool (Grounding 統合)

Gemini の **Google Search retrieval (Grounding)** 機能を `BaseAgent` のオプションとして利用します。

- **目的**: 最新情報や事実確認のための検索。
- **実装**: `BaseAgent` 実行時に `googleSearchRetrieval` を有効化することで、エージェントが自律的に検索結果をコンテキストとして利用します。
- **メリット**: 追加の検索 API キーが不要で、Zero-Cost 戦略に合致し、レスポンスの正確性が向上します。

### 2. GitHubTool (`tools/web/github.tool.ts`)

GitHub 上で公開されているリソースを安全に取得します。

- **目的**: `OpenScore` 等の外部プロジェクトが管理する MusicXML や演奏データの取得。
- **実装**: GitHub Rest API または Raw Content Fetch。
- **メリット**: 未来の「譜例量産」ワークフローの基盤となる。

### 3. TursoUpsertTool (`tools/db/turso-upsert.tool.ts`)

取得・生成したデータを Turso データベースへ永続化します。

- **目的**: エージェントによる DB 書き込み。
- **接続方針**:
  - メインアプリの Drizzle Schema を直接インポートして使用。
  - **前提条件**: `upsert` を正常に動作させるため、メインアプリ側の Schema で `UNIQUE` 制約（作曲家名、作品番号等の組み合わせ）が適切に定義されている必要があります。
  - `upsert` (ON CONFLICT UPDATE) ロジックにより、重複登録を防止し情報を最新に保つ。

## 共通ルール

- 全てのツールは `core/README.md` で定義された `AgentTool` インターフェースを実装する。
- 外部通信が発生する場合は、必ず `ResilientFetcher` を使用する。
- センシティブな情報（GitHub Token 等）は `.env.local` で管理する。
