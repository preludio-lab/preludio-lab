# AI Agent System Design (Strategy & Architecture)

## 1. 戦略 (Strategy)

### 1.1. Concept: "Producer's Role & Tools"

人間の役割は「コードを書くこと」から「AIという優秀なスタッフを指揮するプロデューサー」へとシフトします。
しかし、全てのタスクをAIに丸投げするのではなく、**「0→1 (創造) は 高性能AI (Gemini Advanced)」、「1→100 (量産) は 低コストAI (GitHub Actions)」** という適材適所の分担を行います。

本プロジェクトでは、AIエージェントの役割を**「システム開発（パートナーとしてのAntigravity）」**と**「コンテンツ・データ量産（自動化スクリプトとしてのGoogle AI SDK）」**に明確に分離したハイブリッド・アーキテクチャを採用します。

### 1.2. Cost-Effective Architecture ("Two-Sword" Style)

APIコストを極限まで抑えるため、以下のレイヤードアーキテクチャを採用します。

| Category        | Environment             | Account / Cost          | Role & Usage Purpose                                                                                                                                    |
| :-------------- | :---------------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Development** | **Antigravity (IDE)**   | **Subscription**        | **"The Partner" (Architect)**<br>・複雑な設計、プロトタイプ作成。<br>・"Gold Standard" となるMDXや指示書の作成。                                        |
| **Production**  | **Google AI SDK / CLI** | **Free Tier (API Key)** | **"The Factory" (Worker)**<br>・マスターデータの量産 (One to Hundred)。<br>・多言語翻訳、アセット収集、定期更新。<br>・GitHub Actionsによるバッチ処理。 |

### 1.3. Production Strategy: "Automated Pipe"

制作プロセスは、チャットボットとの会話ではなく、**「厳格なI/O定義に基づいたステートフルな自動処理パイプ」**として実装します。

1.  **Logical Core Domain**: `src/domain`, `src/application` を純粋なドメイン層として維持し、Agent から直接インポートして再利用する（物理的な移動は行わない）。
2.  **State Management**: 中間生成物と進捗をローカルファイル (`state/` または `.cache/`) に永続化し、エラー時の中断・再開 (Resumability) を保証する。手軽なファイルベース管理を基本とする。
3.  **Deterministic Validation**: LLM による修正の前に、Zod によるプログラム的な型チェックと自動修復を優先し、コストを削減する。

### 1.4. Execution Environments & Limits

#### A. Local Environment (Admin CLI)

- **目的**: 試行錯誤、即時修正、特定のマスターデータの先行生成。
- **構成**: ディレクトリ内のスクリプトを `pnpm exec tsx` 等で実行。

#### B. GitHub Actions Environment (Batch)

- **目的**: 定形作業、多言語展開、バルク処理。
- **制約 (Zero Cost)**:
  - **Flash Model (gemini-3-flash-preview)**: 1.5K RPD / 15 RPM を最大限活用。データ量産は原則 Flash を推奨。
  - **Staging State**: いきなり公開せず、`status: review_pending` として保存し、人間による最終承認プロセスを経る。

## 2. システム設計 (Architecture)

### 2.1. Agent Team Structure (MAS)

単一の万能エージェントではなく、専門特化した複数のエージェントが協調して動作する **Multi-Agent System (MAS)** を構築します。

| Agent Name     | Role     | Model (Typ.)               | Responsibility                                                 |
| :------------- | :------- | :------------------------- | :------------------------------------------------------------- |
| **Director**   | 進行管理 | Human / Script             | 全体のワークフロー制御、品質基準の策定。                       |
| **Writer**     | 執筆     | gemini-3-flash-preview     | 音楽理論に基づいた深い解説記事の執筆。                         |
| **Composer**   | 楽譜生成 | gemini-3-flash-preview     | ABC記法の生成と修正。                                          |
| **Translator** | 翻訳     | gemini-3-flash-preview     | 7言語への多言語展開。JSON/MDXの構造を維持したまま翻訳。        |
| **Curator**    | 画像生成 | gemini-3-pro-image-preview | 記事の雰囲気に合ったサムネイル画像の生成。                     |
| **Validator**  | 品質保証 | gemini-3-flash-preview     | 記事の品質を批判的にチェック。音楽的一貫性や内容の深さを評価。 |

### 2.2. Communication: "File Bucket Relay"

エージェント間の通信は、複雑なAPI連携を避け、**ファイルシステム（Git）を介したバケツリレー**方式を採用します。

1.  **Input:** Humanが `drafts/request.json` をCommit。
2.  **Trigger:** GitHub Actionsが変更を検知。
3.  **Process:** Agent A がファイルを読み込み、処理結果を `drafts/intermediate.md` に出力してCommit。
4.  **Next:** 次のActionがそれを検知して Agent B が起動。

この方式により、**「処理の過程が全てGit履歴に残る（可観測性）」** と **「任意のステップから再開可能（耐障害性）」** を実現します。

## 3. 実装詳細 (Implementation Details)

### 3.1. Directory Structure for ADK

アプリケーション本体 (`preludiolab/src`) とは明確に分離し、独立した開発ライフサイクルを持つ「工場」として `agents/` ディレクトリを構築します。

```text
.                              # ★ エージェント開発キット (ADK) ルルート
├── package.json               # ESM設定 ("type": "module")、Gemini SDK、Zod 等
├── pnpm-lock.yaml             # パッケージ管理は pnpm を使用
├── .env.example               # 環境変数のテンプレート
├── .env.local                 # Gemini APIキー等のローカル秘密情報
├── tsconfig.json              # パスエイリアス設定 (@/* -> ./src/*)
├── src/
│   ├── core/                  # 基盤ロジック（LLMラップ、履歴管理、キャッシュ）
│   │   ├── agent.ts           # エージェント基底クラス (BaseAgent)
│   │   ├── fetcher.ts         # アトミックキャッシュ付き HTTP クライアント
│   │   └── tool.ts            # ツール定義基底
│   ├── agents/                # エージェント定義（役割定義と推論ロジック）
│   │   └── composer/          # 作曲家生成に特化したエージェント群
│   ├── schemas/               # 中間データ・エージェントI/O用Zodスキーマ
│   ├── tools/                 # エージェントが使用する機能（関数実装）
│   ├── workflows/             # 実行用スクリプト（Thin Orchestrator）
│   └── infrastructure/        # CLI用リポジトリ実装（直接DB接続、ファイルシステム）
├── .cache/                    # フェッチキャッシュ、タスク状態の永続化
└── workspace/                 # ローカル作業領域・スクラッチパッド
    ├── temp/                  # 生成途中のドラフト（一時保存）
    └── cache/                 # ダウンロードしたソース（MusicXML 等）
```

### 3.2. Sub-Component Documentation

各モジュールの詳細な仕様と実装方針については、以下のドキュメントを参照してください。

- [**Core Module (`src/core`)**](./src/core/README.md): Gemini API のラップ、会話履歴管理、アトミックな通信キャッシュ。
- [**Tools Module (`src/tools`)**](./src/tools/README.md): 外部検索、DB操作、MusicXML解析などの具象ツール定義。
- [**Workflows Module (`src/workflows`)**](./src/workflows/README.md): 状態永続化 (`TaskStateManager`) を備えた実行パイプライン。

### 3.3. Component Design (Code Concepts)

Google Generative AI SDKを直接利用するのではなく、プロジェクトの規律（JSON Mode、型安全性、エラーハンドリング）を強制するための薄いラッパー層を設けます。

#### A. Core: Base Agent (Wrapper)

`@google/generative-ai` をラップし、`zod` スキーマに基づいた構造化出力を保証する基底クラスです。

```typescript
// src/core/agent.ts (Conceptual)
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { z } from "zod";

export class BaseAgent {
  constructor(config: AgentConfig) { ... }

  /**
   * 構造化出力 (JSON Mode) の生成。
   * Zod スキーマを Gemini 側の SchemaType に変換し、出力構造を API レベルで強制します。
   */
  async generateObject<T>(prompt: string, schema: z.ZodType<T>): Promise<T> { ... }

  /**
   * ツールを使用した自律的な対話実行 (Function Calling)。
   * - Zod バリデーションによる型安全性の担保
   * - 複数ツールの並列実行 (Promise.all) による待機時間最小化
   * - 中間ステータス更新のための UI フック (onToolCall)
   * - 無限推論を防ぐ動的なループ上限設定 (maxSteps)
   */
  async runWithTools(
    messages: Message[],
    tools: AgentTool<any, any>[],
    options?: RunWithToolsOptions
  ): Promise<string> { ... }
}
```

#### B. Agents & Schemas: Specialized AI Units

役割（Persona）ごとにシステム指示と推論ロジックをクラスとしてカプセル化します。データ構造（Schema）は `src/schemas` に分離し、型安全性を確保します。

```typescript
// src/agents/composer/draft-agent.ts
import { BaseAgent } from '@/core/agent.js';
import { ComposerDraftSchema } from '@/schemas/composer.js';

const SYSTEM_INSTRUCTION = `あなたはクラシック音楽の専門家です...`;

export class ComposerDraftAgent {
  private agent: BaseAgent;

  constructor(config: { modelName: string }) {
    this.agent = new BaseAgent({
      modelName: config.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }

  async execute(name: string) {
    const prompt = `${name} についてのドラフトを作成してください。`;
    return await this.agent.generateObject(prompt, ComposerDraftSchema);
  }
}
```

#### C. Workflows: Executable Scripts

CLI や CI から実行されるエントリーポイントです。「マスタデータを読み込み、エージェントを呼び出し、成果物を保存する」一連の流れを定義します。

```typescript
// src/workflows/create-article.ts
async function main() {
  // 1. リクエストの読み込みとValidation (Validate-First)
  const request = await readJson('workspace/inbox/req.json');

  // 2. エージェントの実行 (副作用を持たない推論)
  const writer = createWriterAgent();
  const article = await writer.run(request, ArticleSchema);

  // 3. 成果物の保存 (Thin Orchestratorによる確実な書き込み)
  await saveMdx('src/content/works/...', article);
}
```

### 3.5. Separation of Concerns (Thin Orchestrator)

ワークフローとエージェントの役割を厳格に分離する **Thin Orchestrator** パターンを採用します。

- **エージェントの役割 (Pure Function)**: コンテキストと入力を受け取り、構造化データやテキストを出力（推論）すること。ファイル出力やDB保存などの「副作用」を直接持たせてはなりません。
- **ワークフローの役割 (Side Effects)**: 「情報の読み込み」「エージェントへの指示」「返却されたデータの検証・保存機能の呼び出し (`AgentDataWriterTool`)」を担当し、プロセス全体のエラーと冪等性を管理します。

### 3.4. Execution Environment & Future Work

- **Local Execution:** ディレクトリ配下のスクリプトをローカルで実行し、高速にイテレーションを回します。
- **CI/CD Execution (Phase 2):** GitHub Actions をランタイムとして利用し、`workspace/inbox` へのコミットをトリガーに対応する `flows` を自動実行する環境を構築します。これにより、"Commit-driven Development" を実現します。

## 4. Roadmap

1.  **Phase 1**: `Master Data Agent` (Composer/Work) の CLI 実装。
2.  **Phase 2**: `Content Agent` (Article/Phrase/Image) のワークフロー定義と実装。
3.  **Phase 3**: GitHub Actions による全自動バッチ・パイプラインの構築。
