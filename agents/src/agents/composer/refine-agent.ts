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
- impressionDimensions: 作曲家の作風・特徴を表す6軸の印象評価値です。必ず -10 から +10 の整数で6項目 (innovation, emotionality, nationalism, scale, complexity, theatricality) すべてを出力してください。小数の使用や省略は厳禁です。
  * innovation: 伝統的(-10) <-> 中立(0) <-> 革新的(+10)
  * emotionality: 知的・構造的(-10) <-> 中立(0) <-> 感情的・情動的(+10)
  * nationalism: 国際的・普遍的(-10) <-> 中立(0) <-> 民族的(+10)
  * scale: 親密・室内楽的(-10) <-> 中立(0) <-> 壮大・大編成(+10)
  * complexity: 簡潔・明快(-10) <-> 中立(0) <-> 複雑・難解(+10)
  * theatricality: 絶対音楽(-10) <-> 中立(0) <-> 演劇的・標題音楽的(+10)
- places[].type: "birth", "death", "activity", "other" の4値のみ。
- _generatorMeta.confidenceScore: 0.0 から 1.0 の間の数値（例: 0.95）。
- 肖像画 (portrait): 必ず \`/composers/{slug}/images/portrait.webp\` の形式で出力すること。
- summary: 60〜100字程度の極めて洗練された短い紹介文。「です・ます調」で統一すること。
  【重要】専門用語（対位法、和声など）、生没年、出身地、また冗長な利用シーンの提案は一切禁止。以下の3要素のみを自然な日本語で組み合わせ、親密で魅力的な文章にすること。
  (1) その作曲家名を聞いて誰もが最初に思い浮かべる要素（通称やパブリックイメージ）
  (2) 一言で伝えられるわかりやすい魅力（音楽の素晴らしさ、歴史的功績）
  (3) 最も知名度の高い代表作1〜2曲（必ず『』で囲む）
- _generatorMeta.sourceRefs: 事実確認に用いた権威あるサイトのトップレベルドメインのみを配列で出力すること（例: "https://imslp.org" 等）。Wikipediaは含めないこと。
- birthDate, deathDate: "YYYY-MM-DD" 形式の文字列。タイムゾーン情報は絶対に含めないこと。`;

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
