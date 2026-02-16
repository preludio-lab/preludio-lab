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
  - **Flash Model (Gemini 2.0 Flash)**: 1.5K RPD / 15 RPM を最大限活用。データ量産は原則 Flash を推奨。
  - **Staging State**: いきなり公開せず、`status: review_pending` として保存し、人間による最終承認プロセスを経る。

## 2. システム設計 (Architecture)

### 2.1. Agent Team Structure (MAS)

単一の万能エージェントではなく、専門特化した複数のエージェントが協調して動作する **Multi-Agent System (MAS)** を構築します。

| Agent Name     | Role     | Model (Typ.)   | Responsibility                                            |
| :------------- | :------- | :------------- | :-------------------------------------------------------- |
| **Director**   | 進行管理 | Human / Script | 全体のワークフロー制御、品質基準の策定。                  |
| **Writer**     | 執筆     | Gemini 1.5 Pro | 音楽理論に基づいた深い解説記事の執筆。                    |
| **Composer**   | 楽譜生成 | GPT-4o         | ABC記法の生成と修正。                                     |
| **Translator** | 翻訳     | Gemini Flash   | 7言語への多言語展開。JSON/MDXの構造を維持したまま翻訳。   |
| **Curator**    | 画像生成 | DALL-E 3 / SD  | 記事の雰囲気に合ったサムネイル画像の生成。                |
| **Validator**  | 品質保証 | Script (Zod)   | スキーマ検証、リンク切れチェック、ABC記法の構文チェック。 |

### 2.2. Communication: "File Bucket Relay"

エージェント間の通信は、複雑なAPI連携を避け、**ファイルシステム（Git）を介したバケツリレー**方式を採用します。

1.  **Input:** Humanが `drafts/request.json` をCommit。
2.  **Trigger:** GitHub Actionsが変更を検知。
3.  **Process:** Agent A がファイルを読み込み、処理結果を `drafts/intermediate.md` に出力してCommit。
4.  **Next:** 次のActionがそれを検知して Agent B が起動。

この方式により、**「処理の過程が全てGit履歴に残る（可観測性）」** と **「任意のステップから再開可能（耐障害性）」** を実現します。

## 3. 実装詳細 (Implementation Details)

### 3.1. Directory Structure for Agents

```
.agent/
├── prompts/          # System Prompts for each agent
│   ├── writer.md
│   ├── translator.md
│   └── composer.md
├── workflows/        # GitHub Actions Workflows (Definitions)
│   ├── translate-article.yml
│   └── generate-thumbnail.yml
└── memory/           # Agent's Long-term Memory (RAG source)
    ├── style-guide.md
    └── glossary.json
```

### 3.2. Data Schema for Inter-Agent Communication

エージェント間の指示書として機能するJSONスキーマ例。

```json
// request-translation.json
{
  "targetFiles": ["content/ja/works/bach/prelude.mdx"],
  "targetLanguages": ["en", "de", "fr"],
  "context": {
    "tone": "academic",
    "glossary": ["subdominant", "counterpoint"]
  }
}
```

### 3.3. Execution Environment constraints

- **Stateless:** エージェントはステートを持たず、毎回入力ファイルのみに基づいて出力を生成する。
- **Idempotent:** 何度実行しても同じ結果（または改善された結果）になるように設計する。
- **Sandboxed:** ファイルシステムへの書き込みは、指定されたディレクトリ（`content/` や `data/`）のみに制限される。

## 4. Roadmap

1.  **Phase 1**: `Master Data Agent` (Composer/Work) の CLI 実装。
2.  **Phase 2**: `Content Agent` (Article/Phrase/Image) のワークフロー定義と実装。
3.  **Phase 3**: GitHub Actions による全自動バッチ・パイプラインの構築。
