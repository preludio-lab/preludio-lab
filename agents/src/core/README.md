# AI Agent Core 仕様書

エージェントシステムの基盤となる共通クラスおよびインターフェースを定義します。

## 構成要素

### 1. BaseAgent (`core/agent.ts`)

Google Generative AI SDK (Gemini) の薄いラッパーです。プロジェクト全体の規律を強制します。

- **責務**:
  - Gemini モデルの初期化と設定管理。
  - 構造化出力 (JSON Mode) の強制。
  - **Function Calling のサポート**: `AgentTool` インターフェースを実装したツール群をエージェントに渡し、自律的に選択・実行させる機能。
  - **Grounding (Google Search) の統合**: 生成オプションとして Google 検索連携を切り替え可能にする。
  - トークン利用状況の記録（将来的なコスト管理用）。
- **インターフェース案**:
  ```typescript
  class BaseAgent {
    constructor(config: AgentConfig);
    // 構造化出力の生成
    async generateObject<T>(prompt: string, schema: z.ZodType<T>): Promise<T>;
    // ツールを使用した対話実行 (Function Calling)
    async runWithTools(prompt: string, tools: AgentTool<any, any>[]): Promise<string>;
  }
  ```

### 2. AgentTool Interface (`core/tool.ts`)

エージェントが使用するツールの標準規格です。

- **責務**:
  - 全てのツールに一貫した I/O 形式を強制。
  - Zod による入力値の自動バリデーション。
- **インターフェース定義**:
  ```typescript
  interface AgentTool<I, O> {
    name: string;
    description: string;
    inputSchema: z.ZodType<I>;
    execute(input: I): Promise<O>;
  }
  ```

### 3. ResilientFetcher (`core/fetcher.ts`)

外部 API 通信を一手に担う、耐障害性の高い HTTP クライアントです。

- **責務**:
  - **リトライ制御**: 429 (Rate Limit) や 5xx エラーに対する指数バックオフ付きリトライ。
  - **プロアクティブなスロットリング**: ドメインごとに「秒間リクエスト数」や「リクエスト間隔」を制限するキューの管理。IP BAN や過剰な負荷を未然に防ぐ。
  - **タイムアウト管理**: 遅い外部 API によるプロセス停止を防止。
  - **ユーザーエージェント設定**: Wikipedia API 等で求められる適切な UA の設定。
- **実装方針**:
  - `axios` + `axios-retry` または `p-retry` を基盤に使用。

## 設計原則

- **Zero-Cost**: 無料枠を最大限活用し、無駄な API コールを抑制する。
- **Resilience**: 外部サービスの不調（API 制限、ネットワークエラー）に対して堅牢であること。
- **Type Safety**: I/O は全て Zod を介し、型安全性を保証する。
