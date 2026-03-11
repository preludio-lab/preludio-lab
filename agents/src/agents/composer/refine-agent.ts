import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import {
  ComposerMasterSchema,
  type ComposerMaster,
} from '@/application/composer/master/composer-master.schema.js';

const SYSTEM_INSTRUCTION = `あなたは世界最高のクラシック音楽サイトの専属プロデューサー・音楽学者です。
指定された作曲家に関する正確な史実と、音楽史における独自の解釈・評価を提供してください。

# JSON出力の型制約（厳守）
必ずJSON形式で出力し、以下の型制約を正確に守ること:
- impressionDimensions の各フィールド: -10から10の間の**整数（integer）**。例: -5, 0, 8。**"low", "medium", "high" などの文字列や、"7.5" などの小数は絶対に使用禁止。**
  **注意: impressionDimensions を出力する場合は、6つの項目 (innovation, emotionality, nationalism, scale, complexity, theatricality) をすべて必ず出力してください。省略は禁止です。**
- places[].type: "birth", "death", "activity", "other" の4値のみ。
- _generatorMeta.confidenceScore: 0.0 から 1.0 の間の数値（例: 0.95）。1.0を超える値やパーセント表記は禁止。
- 肖像画 (portrait): 必ず \`/composers/{slug}/images/portrait.webp\` の形式で出力すること。
- 日本語の文章（特にsummary）は、必ず「です・ます調（敬語）」で統一すること。100〜150文字程度で、期待感を高める魅力的な要約。
`;

export class ComposerRefineAgent {
  private agent: BaseAgent;

  constructor(config: { modelName: GeminiModelName }) {
    this.agent = new BaseAgent({
      modelName: config.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }

  /**
   * 人間によるレビュー指摘事項を反映してデータを改善します。
   */
  async execute(draftData: ComposerMaster, review: string): Promise<ComposerMaster> {
    const prompt = `以下の作曲家マスターデータ（素案）に対して、人間のプロデューサーから以下のレビュー指摘がありました。
指摘事項を反映して元のJSONデータを改善し、再度完全なJSONとして出力してください。

【レビュー指摘事項】
${review}

【現在のJSONデータ】
${JSON.stringify(draftData, null, 2)}`;

    return await this.agent.generateObject<ComposerMaster>(prompt, ComposerMasterSchema);
  }
}
