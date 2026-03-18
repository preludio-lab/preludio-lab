# Agent Implementation Guidelines

`agents/src/agents/` デレクトリは、特定のドメインタスク（例: 作曲家データの生成、翻訳、校正）に特化した AI エージェントの定義を配置する場所です。
本プロジェクトでは、AI の「推論ロジック」とワークフローの「副作用・進行管理」を明確に分離する **Thin Orchestrator** パターンを採用しています。

## 基本原則 (Core Principles)

### 1. 責務の分離 (Separation of Concerns)

- **Agent の役割 (Stateless Intelligence)**:
  - システム指示（役割定義）の保持。
  - プロンプトの構築（動的パラメータの注入）。
  - LLM へのリクエスト実行と構造化データの受け取り。
  - **副作用（ファイル保存、DB更新、APIリクエスト等）を直接持ってはいけません。**
- **Workflow の役割 (Side-Effect Orchestrator)**:
  - ファイルの入出力、状態管理、リトライ制御。
  - 複数のエージェントやツールの繋ぎ込み。

### 2. 包含による構成 (Composition over Inheritance)

- `BaseAgent` を継承（extends）するのではなく、内部にプライベートプロパティとして保持（has-a）してください。
- これにより、1つのエージェントクラス内で将来的に複数のモデルを使い分けたり、複雑なロジックをカプセル化しやすくなります。

### 3. モデルの外部注入 (Model Injection)

- 使用するモデル（`modelName`）は、コンストラクタの引数として外部（Workflow）から注入できるようにしてください。
- 実行時のレートリミット回避や、コスト最適化のために Workflow 側でモデルを一元管理するためです。

### 4. 厳格な型制約とタクソノミー準拠 (Strict Type Constraints)

- **Zod Enum の活用**: 時代区分、楽器ID、タグなど、リストが固定されているフィールドには `z.string().describe('選択肢: ...')` ではなく、**`z.enum([...])` を直接使用**してください。
- **Structured Outputs の強制**: プロンプトでの指示だけでなく、スキーマレベルで制約をかけることで、LLMが「リストにない類似の文字列」を出力するエラー（ハルシネーション）を技術的に100%排除できます。
- **タクソノミー同期**: 使用する Enum は原則として `src/domain/` 配下の正解データ（Taxonomy）からインポートして生成してください。

### 5. 例外処理 (Error Propagation)

- エージェント内でのバリデーションエラーや API エラーは、`catch` して握り潰さず、そのまま上流（Workflow）へ `throw` してください。
- Workflow 側でリトライや異常終了のハンドリングを一括して行います。

### 6. シングルパス・スキーマベースの推論 (Single-pass Schema-based CoT)

ハルシネーション（事実誤認）やフォーマットの揺れを防ぐためのベストプラクティスとして、Zodスキーマの先頭（最上位）に `_reasoning` などの「思考プロセス用フィールド」を配置する手法を推奨します。

- **対象タスク**: 新規データ生成 (`draft`)、および人間による指摘の反映 (`refine`) で特に有効です。単純な文字列翻訳 (`translate`) では必須ではありませんが、文脈判断が必要な場合は導入を検討してください。
- **自己回帰型（Autoregressive）モデルの活用**: LLMにとって、JSONは構造化データである以前に「上から下へ順番に生成されるテキストストリーム」です。本データを生成する**前**に `_reasoning` で事実関係や構成案を出力させることで、それが強力なコンテキスト（思考の足場）として保持され、直後のフィールド生成精度が劇的に向上します。
- **コスト・レイテンシの最適化**: 「計画」と「実行」でAPIコールを分ける（マルチパス）のではなく、Zodスキーマのキー順序を工夫して1回の `generateObject` に推論プロセスを収めることで、Zero-Cost ArchitectureにおけるAPIコストと実行時間の最適化に寄与します。
- **不要フィールドの除外**: 生成結果を永続化（保存）する直前にワークフロー側で `_reasoning` を `omit`（除外）することで、クリーンなマスターデータのみを残すことができます。

### 7. ローカライズと翻訳の原則 (Localization Principles)

翻訳エージェントを実装する際は、単なる「直訳」を避け、以下の品質基準を維持してください。

- **ローカライズ・バイアスの排除**: 「日本での通称」に引きずられず、ターゲット言語圏における標準的な呼称（例: 運命交響曲 -> Fifth Symphony）を優先してください。
- **タイポグラフィの最適化**: 言語ごとに正しい引用符（英: ' ', 仏: « », 中: 《 》）や正書法（独: ウムラウト, スペースの有無）を厳格に適用してください。
- **UI制約の継承**: 日本語ドラフトが持つ「情報の凝縮感（60-100文字程度）」を翻訳後も維持し、カードレイアウト等のUIを破壊しない簡潔な表現を心がけてください。

## 実装例 (Template)

```typescript
import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import { MyTargetSchema, type MyTargetInput } from '@/schemas/my-domain.js';

const SYSTEM_INSTRUCTION = `あなたは...のスペシャリストです。
...というルールを守って回答してください。`;

export class MySpecializedAgent {
  private agent: BaseAgent;

  constructor(config: { modelName: GeminiModelName }) {
    this.agent = new BaseAgent({
      modelName: config.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }

  async execute(input: MyTargetInput): Promise<MyTargetOutput> {
    // 1. プロンプトの組み立て
    const prompt = `以下のデータを元に...を生成してください:\n${JSON.stringify(input)}`;

    // 2. 推論の実行（エラーは Workflow へ伝播させる）
    return await this.agent.generateObject(prompt, MyTargetSchema);
  }
}
```

## ディレクトリ構造

- `composer/`: 作曲家マスタ生成に関連するエージェント群 (`draft`, `refine`, `translate`)
- `work/`: 楽曲・楽章マスタ生成に関連するエージェント群 (`draft`, `work-part-draft`, `translate`)
- `article/`: 記事執筆・校正に関連するエージェント群 (予定)
