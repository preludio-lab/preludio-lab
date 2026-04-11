import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import {
  WorkMultilingualPatchSchema,
  type WorkDraft,
  type WorkMultilingualPatch,
} from '@/schemas/work.js';

const SYSTEM_INSTRUCTION = `あなたは世界最高のクラシック音楽サイトの多言語エディター兼音楽学者です。
翻訳済みデータ（全7言語：ja, en, de, fr, it, es, zh）の品質を精査し、人間からの指摘事項に基づいた修正パッチを生成してください。

# 責務
1. **多言語品質の担保 (Translation Review)**: 各言語の不自然な表現、誤訳、および「静謐と気品」というトーンへの適合性を精査してください。
2. **言語特有の修正**: 特に中国語(zh)における日本語漢字の混入（例：間の混入）、フランス語の音楽用語の格調（例：調性表記法）などを厳格に修正してください。
3. **人間による指摘の反映**: 具体的な修正指示がある場合、それを最優先で反映してください。

# パッチ生成モードのルール (極めて重要)
- **【最小パッチの原則】**: あなたは「修正パッチ」のみを生成します。指摘された箇所のフィールド（description, compositionPeriod 等）のみを出力に含めてください。修正が不要なフィールドは出力に含めないでください。
- **【言語の部分更新の許容】**: 
  - 特定の言語（例：フランス語と中国語のみ）への修正指示がある場合、**それらの言語キーのみを含むオブジェクト**として出力しても構いません。
  - すべての言語（7言語）を常に再度出力する必要はありません。修正が必要な言語だけをキーに含めてください。
  - [例]: { "description": { "fr": "Nouvelle description", "zh": "新描述" } }
- **【構造の維持】**: フィールド（description等）は必ず「オブジェクト形式」を維持してください。単一の文字列（"..."）での出力は厳禁です。
- **【タイトルの要素分解】**: タイトル構成（titleComponents）の修正を行う場合も、要素分解された構造（distinctiveTitle, nickname）を維持してください。`;

export class WorkRefineTranslateAgent {
  private agent: BaseAgent;

  constructor(config: { modelName: GeminiModelName }) {
    this.agent = new BaseAgent({
      modelName: config.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }

  /**
   * 翻訳済みデータに対して、レビュー指摘に基づいた修正パッチを生成します。
   * 修正が必要な言語のみを内包した部分的なオブジェクトを返します。
   */
  async refineMultilingualPatch(
    targetData: WorkDraft,
    review: string,
  ): Promise<WorkMultilingualPatch> {
    const prompt = `以下の多言語データに対して、レビュー指摘を反映した「修正パッチ」をJSON形式で作成してください。
修正が必要なフィールドの、修正が必要な言語キーのみを含めてください。

【レビュー指摘事項】
${review}

【現在の多言語データ（参考）】
${JSON.stringify(targetData, null, 2)}

# 出力形式
- 修正が必要なフィールドのみを含めること。
- 多言語フィールド（description等）は、修正が必要な言語キー（ja, en, de, fr, it, es, zhのいずれか）のみを含むオブジェクトとすること。`;

    const patch = await this.agent.generateObject(prompt, WorkMultilingualPatchSchema, {
      metadataContext: (targetData as Record<string, unknown>)._generatorMeta as Record<
        string,
        unknown
      >,
    });

    return patch as WorkMultilingualPatch;
  }
}
