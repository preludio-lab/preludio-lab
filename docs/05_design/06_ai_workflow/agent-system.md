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
2.  **State Management**: 中間生成物と進捗をローカルファイル (`agents/state`) や DB に永続化し、エラー時の中断・再開 (Resumability) を保証する。手軽なファイルベース管理を基本とする。
3.  **Deterministic Validation**: LLM による修正の前に、Zod によるプログラム的な型チェックと自動修復を優先し、コストを削減する。

### 1.4. Execution Environments & Limits

#### A. Local Environment (Admin CLI)

- **目的**: 試行錯誤、即時修正、特定のマスターデータの先行生成。
- **構成**: `agents/` ディレクトリ内のスクリプトを実行。

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
agents/                        # ★ エージェント開発キット (ADK) ルート
├── package.json               # ESM設定 ("type": "module")、Gemini SDK、Zod 等
├── pnpm-lock.yaml             # パッケージ管理は pnpm を使用（本体と統一）
├── .env.example               # 環境変数のテンプレート
├── .env.local                 # Gemini APIキー等のローカル秘密情報
├── tsconfig.json              # パスエイリアス設定 (@/* -> ../src/*)
├── src/
│   ├── core/                  # 基盤ロジック（LLMラップ等）
│   │   ├── llm.ts             # Google SDK のラッパー
│   │   ├── agent.ts           # エージェント基底クラス
│   │   └── tool.ts            # ツール定義基底
│   ├── prompts/               # エージェント定義（プロンプト & スキーマ）
│   │   ├── writer.ts          # ライター用エージェント
│   │   ├── reviewer.ts        # レビュー用エージェント
│   │   └── translator.ts      # 翻訳用エージェント
│   ├── tools/                 # エージェントが使用する機能（関数実装）
│   │   ├── search.ts          # Google 検索 (Grounding)
│   │   └── music-xml.ts       # 楽譜解析
│   ├── workflows/             # 実行用スクリプト（エントリーポイント）
│   │   ├── create-article.ts
│   │   └── sync-master-data.ts
│   ├── infrastructure/        # CLI用リポジトリ実装（直接DB接続、ファイルシステム）
│   └── state/                 # タスク進捗管理（JSON または SQLite）
└── workspace/                 # ローカル作業領域・スクラッチパッド
    ├── temp/                  # 生成途中のドラフト（一時保存）
    └── cache/                 # ダウンロードしたソース（MusicXML 等）
```

### 3.2. Component Design (Code Concepts)

Google Generative AI SDKを直接利用するのではなく、プロジェクトの規律（JSON Mode、型安全性、エラーハンドリング）を強制するための薄いラッパー層を設けます。

#### A. Core: Base Agent (Wrapper)

`@google/generative-ai` をラップし、`zod` スキーマに基づいた構造化出力を保証する基底クラスです。

```typescript
// agents/src/core/agent.ts (Conceptual)
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { z } from "zod";

export class BaseAgent {
  constructor(
    private modelName: string,
    private systemInstruction: string
  ) { ... }

  /**
   * 構造化出力の検証を伴う生成の実行
   */
  async run<T>(input: string, schema: z.ZodType<T>): Promise<T> {
    // 1. 生成の設定 (responseMimeType: "application/json" 等)
    // 2. Gemini API の呼び出し
    // 3. JSON のパースと Zod による検証
    // 4. レート制限 (429) 回避のための Exponential Backoff を伴う再試行制御
    return schema.parse(JSON.parse(response));
  }
}
```

#### B. Prompts & Schemas: Specialized Agents

役割（Persona）ごとにプロンプトテンプレートと出力責任（Schema）を定義します。

```typescript
// agents/src/prompts/writer.ts
import { BaseAgent } from "../core/agent";

export const ArticleSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(z.object({ ... }))
});

export const createWriterAgent = () => {
  return new BaseAgent(
    "gemini-3-flash-preview", // ライター役には最新の高性能モデルを割り当て
    `あなたはPreludioLabの専属ライターです。
     読者はクラシック音楽の初心者です...`
  );
};
```

#### C. Workflows: Executable Scripts

CLI や CI から実行されるエントリーポイントです。「マスタデータを読み込み、エージェントを呼び出し、成果物を保存する」一連の流れを定義します。

```typescript
// agents/src/workflows/create-article.ts
async function main() {
  // 1. リクエストの読み込み
  const request = await readJson('agents/workspace/inbox/req.json');

  // 2. エージェントの実行
  const writer = createWriterAgent();
  const article = await writer.run(request, ArticleSchema);

  // 3. 成果物の保存
  await saveMdx('src/content/works/...', article);
}
```

### 3.3. Execution Environment & Future Work

- **Local Execution:** 開発者は `agents/` 下のスクリプトをローカルで実行し、高速にイテレーションを回します。
- **CI/CD Execution (Phase 2):** GitHub Actions をランタイムとして利用し、`workspace/inbox` へのコミットをトリガーに対応する `flows` を自動実行する環境を構築します。これにより、"Commit-driven Development" を実現します。

## 4. Roadmap

1.  **Phase 1**: `Master Data Agent` (Composer/Work) の CLI 実装。
2.  **Phase 2**: `Content Agent` (Article/Phrase/Image) のワークフロー定義と実装。
3.  **Phase 3**: GitHub Actions による全自動バッチ・パイプラインの構築。
