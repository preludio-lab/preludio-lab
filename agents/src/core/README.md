# AI Agent Core 仕様書

エージェントシステムの基盤となる共通クラスおよびインターフェースを定義します。

## 概要

AIエージェントの基盤となるコア機能（LLM操作、ツール定義、外部通信）を提供するディレクトリです。

## 目的

1. **Gemini APIの抽象化**: `BaseAgent` を通じて、LLMとの対話や構造化出力、Function Callingを標準化する。
2. **ツールの規格化**: `AgentTool` インターフェースにより、すべてのツールが統一された形式でエージェントに利用されるようにする。
3. **外部通信の堅牢化**: サードパーティAPI等と通信する際のレート制約やエラーハンドリングを `ResilientFetcher` で吸収する。

## 実装方針（設計原則）

- **Zero-Cost**: 無料枠を最大限活用し、無駄な API コールを抑制する。
- **Resilience**: 外部サービスの不調（API 制限、ネットワークエラー）に対して堅牢であること。
- **Type Safety**: I/O は全て Zod を介し、型安全性を保証する。

## 構成要素

### 1. BaseAgent (`core/agent.ts`)

Google Generative AI SDK (Gemini) の薄いラッパーです。プロジェクト全体の規律を強制します。

- **責務**:
  - Gemini モデルの初期化と設定管理。
  - 構造化出力 (JSON Mode) の強制。
  - **Function Calling のサポート**: `AgentTool` インターフェースを実装したツール群をエージェントに渡し、自律的に選択・実行させる機能。
  - **会話履歴（コンテキスト）管理**: 単発のプロンプトだけでなく、過去のやり取り（Roleごとのメッセージ配列）を状態として適切に保持・管理し、複数ターンのFunction Callingによる推論プロセスを実現する。
  - **Grounding (Google Search) の統合**: 生成オプションとして Google 検索連携を切り替え可能にする。
  - トークン利用状況の記録（将来的なコスト管理用）。
- **インターフェース案**:
  ```typescript
  class BaseAgent {
    constructor(config: AgentConfig);
    // 構造化出力の生成
    async generateObject<T>(prompt: string, schema: z.ZodType<T>): Promise<T>;
    // ツールを使用した自律的な対話実行 (Function Calling)
    // コンテキスト（会話履歴）を受け取り複数ターンの実行を行う
    async runWithTools(messages: Message[], tools: AgentTool<any, any>[]): Promise<string>;
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
  - **キャッシュ層（ローカル永続化）**: `workspace/cache/` 等のファイルシステムを利用したレスポンスのリッチなキャッシュ機能を提供。再実行時や同一エンドポイントへの重複フェッチを防ぎ、API制限回避と時間・コストの削減を図る。
  - **タイムアウト管理**: 遅い外部 API によるプロセス停止を防止。
  - **ユーザーエージェント設定**: Wikipedia API 等で求められる適切な UA の設定。
- **実装方針**:
  - `axios` + `axios-retry` または `p-retry` を基盤に使用。
