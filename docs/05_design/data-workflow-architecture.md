# Data Generation AI Workflow Architecture

本ドキュメントでは、Google AI SDK (Gemini API) を使用したデータ生成ワークフローの全体的な技術アーキテクチャを定義します。

## 1. Directory Structure

Next.js アプリケーションの既存モジュール (`src/`) を「Core Domain」として定義し、Agent からも再利用する Pragmatic な構成を採用します。
物理的な `packages/` への移動は行わず、`tsconfig` の Path Alias と厳格なインポートルールによって論理的な分離を実現します。

```text
.
├── agents/             # AI Batch Processor (Stateful & Robust)
│   ├── core/           # Orchestrator, Gemini Wrapper
│   ├── workflows/      # Workflow Defs (Composer, Work, Content)
│   ├── state/          # State Management (Local JSON/SQLite)
│   ├── infrastructure/ # CLI/Batch Environment specific Repositories
│   └── prompts/        # System Prompts
│
└── src/                # Shared Core Domain & Next.js App
    ├── domain/         # ★ Entity, ValueObject, ZodSchema (Agentから利用可)
    ├── application/    # ★ UseCase, IO Interface (Agentから利用可)
    ├── infrastructure/ # Repository Impl (Agentからは原則利用せず、DIで差し替えるか、慎重に利用)
    └── app/            # Next.js Routing (Agentからは利用不可)
```

## 2. Technical Approach: Efficient Integration

### Logical Core Domain

`src/domain` と `src/application` は、Next.js 固有機能（`next/navigation`等）への依存を持たない純粋な TypeScript モジュールとして実装されています。
これらを Agent プロジェクト (`agents/tsconfig.json`) から `src/` として直接インポートすることで、コードの重複とリファクタリングコストをゼロにします。

### Interface-based Dependency Injection

`src/application` 内のユースケースは、`IRepository` インターフェースにのみ依存しています。
Agent 実行環境では、Next.js 用の `infrastructure` (Vercel Postgres等) の代わりに、CLI 用の `agents/infrastructure` (Direct DB Access / SQLite) を DI することで、同じビジネスロジックを安全に再利用します。

### Strict Dependency Rules

Agent が `src/` を利用する際、Next.js 固有機能（`next/*`）が含まれているとランタイムエラーが発生します。
これを防ぐため、`eslint-plugin-import` 等を用いて以下のルールを機械的に強制します。

- `src/domain/**` は `next/*`, `react`, `src/infrastructure/**` に依存してはならない。
- `src/application/**` は `next/*`, `react` に依存してはならない。

## 3. Agent Execution Lifecycle (Stateful & Cost-Effective)

単一の生成で完結せず、以下のサイクルを通じてデータの精度を向上させます。特に譜例生成（SVG）は重いため、非同期で分離します。

1.  **Initialize & Check State**: ターゲットの処理進捗を確認し、未完了ステップから開始。
2.  **Structural Research**: 検索結果を構造化データとして保存。
3.  **Draft Production**: `responseSchema` を活用し、構造的に正しい JSON を生成。
4.  **Async Score Generation**: 譜例生成 (Verovio/SVG) は独立した非同期ワーカーで実行し、記事生成とは分離する（タイムアウト回避）。
5.  **Programmatic Validation (Zod)**: LLM Critique の前に、プログラムによる型チェックと自動修復を実行。
6.  **Semantic Critique (LLM)**: 「内容の正確性」「トーン」のみを AI がレビュー。
7.  **Persist to Staging**: `status: review_pending` として DB に保存し、人間による最終確認を待つ。
