# Data Generation AI Workflow Architecture

本ドキュメントでは、Google AI SDK (Gemini API) を使用したデータ生成ワークフローの全体的な技術アーキテクチャを定義します。

## 1. Directory Structure

Next.js フロントエンド、共有ドメインロジック、エージェントを、論理的・物理的に整合性を持って配置します。

```text
.
├── agents/                  # AI Data Pipeline & Batch Processor (Node.js/TS)
│   ├── src/
│   │   ├── core/            # Gemini API Wrapper, ADK Orchestrator
│   │   ├── workflows/       # 業務フロー (ex: score-extraction-flow.ts)
│   │   ├── infrastructure/  # CLI用Repo実装 (File System, Direct DB Access)
│   │   ├── state/           # 進捗管理 (SQLite/Local JSON)
│   │   └── prompts/         # プロンプトテンプレート (.md / .txt)
│   ├── tsconfig.json        # src/domain を参照するための Path Alias 設定
│   └── package.json
│
├── src/                     # Shared Core & Web Application
│   ├── domain/              # ★ ビジネスルール・エンティティ (Agentと共有)
│   │   ├── models/          # Article, Work, MusicalExample 等の型定義
│   │   ├── schemas/         # Zodによるバリデーションスキーマ
│   │   └── services/        # 譜例抽出ロジック等の純粋なドメインサービス
│   │
│   ├── application/         # ★ ユースケース・インターフェース (Agentと共有)
│   │   ├── use-cases/       # 記事生成、楽譜パース等の抽象シナリオ
│   │   └── repositories/    # IArticleRepository 等のインターフェース定義
│   │
│   ├── infrastructure/      # Webアプリ用実装 (Next.js環境依存)
│   │   ├── turso/           # LibSQL Client / Drizzle ORM
│   │   ├── r2/              # Cloudflare R2 Client (MDX配信)
│   │   └── verovio/         # サーバーサイドSVGレンダラー実装
│   │
│   └── app/                 # Next.js App Router (UI/Routing)
│
├── public/                  # 静的資産 (生成済みSVG譜例等のキャッシュ先)
└── tsconfig.json            # Path Aliases (@/* -> src/*)
```

## 2. Technical Approach: Efficient Integration

### Logical Core Domain

`src/domain` と `src/application` は、Next.js 固有機能（`next/navigation`等）への依存を持たない純粋な TypeScript モジュールとして実装します。これらを Agent から直接インポートすることで、コードの重複を排除します。

### Abstraction of Infrastructure

`src/application/repositories` でインターフェースを定義し、環境に応じて実装を差し替えます。

- **Web 実行時**: `src/infrastructure` の実装（LibSQL/Drizzle, R2 Client 等）を使用。
- **Agent 実行時**: `agents/infrastructure` の実装を使用。レート制限を考慮した直接的な DB 操作や、中間データの保存（State 管理）を行います。

### Async Score Generation Workflow

譜例（SVG）生成は Verovio (WASM) の負荷が高いため、テキスト生成とは別の非同期ステップとして実行します。

1. **Drafting**: Agent が記事テキストと「必要な譜例の定義（小節番号、パート等）」を生成し DB に保存。
2. **Engraving**: 別の Worker (Agent) が DB を監視し、定義に基づき `src/domain/services` のロジックで小節を抽出。
3. **Rendering**: Verovio を用いて SVG を生成し、R2 または `public/` へ配置し、パスを DB に更新。

### Strict Dependency Rules

`eslint-plugin-import` を用い、`domain` 層や `application` 層が `next/*` や `react`、`infrastructure` に依存することを厳格に禁止します。

## 3. Agent Execution Lifecycle (Stateful & Cost-Effective)

単一の生成で完結せず、以下のサイクルを通じてデータの精度を向上させます。特に譜例生成（SVG）は重いため、非同期で分離します。

1.  **Initialize & Check State**: ターゲットの処理進捗を確認し、未完了ステップから開始。
2.  **Structural Research**: 検索結果を構造化データとして保存。
3.  **Draft Production**: `responseSchema` を活用し、構造的に正しい JSON を生成。
4.  **Async Score Generation**: 譜例生成 (Verovio/SVG) は独立した非同期ワーカーで実行し、記事生成とは分離する（タイムアウト回避）。
5.  **Programmatic Validation (Zod)**: LLM Critique の前に、プログラムによる型チェックと自動修復を実行。
6.  **Semantic Critique (LLM)**: 「内容の正確性」「トーン」のみを AI がレビュー。
7.  **Persist to Staging**: `status: review_pending` として DB に保存し、人間による最終確認を待つ。
