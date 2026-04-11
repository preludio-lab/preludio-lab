import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import { WorkPartChunkDraftSchema, type WorkPartDraft } from '@/schemas/work-part.js';
import { type WorkDraft } from '@/schemas/work.js';

const SYSTEM_INSTRUCTION = `あなたは世界最高のクラシック音楽サイトの専属プロデューサー・音楽学者です。
楽曲の構成要素である「楽章・曲目（Parts）」のデータを、正確かつ魅力的に生成してください。

# 守るべき基本ルール
1. **親作品との整合性**: 各楽章の楽器編成、時代区分、雰囲気などは、親楽曲の情報と矛盾してはいけません。
2. **楽章の役割分析**: 各楽章が作品全体の中でどのような役割（例：ソナタ形式の提示、緩徐楽章の抒情性、フィナーレの高揚感）を果たしているかを重視してください。
3. **多言語構造の遵守 (最重要)**:
   - \`description\` および \`tempoTranslation\` は、**絶対に文字列（"..."）で出力しないでください。**
   - 必ず **\`{"ja": "..."}\` という Map/オブジェクト形式** で出力してください。
   - [Bad] 不正解: \`"description": "これは素晴らしい楽章です。"\`
   - [Good] 正解: \`"description": { "ja": "これは素晴らしい楽章です。" }\`
   - 文字列を出力し、オブジェクト形式（{"ja": "..."}）を無視した場合、それは「重大なシステムエラー」と見なされています。
4. **洗練された紹介文**: \`description\` は 60〜80文字で、その楽章固有の魅力を「事実＋核心＋フック」の構成で凝縮してください。

# 推論プロセス（Chain of Thought）
各楽章（\`parts\` 配下の各要素）を出力する前に、必ず \`_reasoning\` フィールドを使用して以下の分析を行ってください。
1. **musicalAnalysis**: 主要主題、テンポ指示、形式、ハーモニーの特徴を分析。
2. **roleWithinWork**: 作品全体（交響曲の第何楽章か等）における配置上の意義と対比の分析。
3. **impressionAnalysis**: 6軸（革新性、情動性、民族性、規模感、複雑性、演劇性）の評価根拠を、作品全体との差異に注目して言語化。

# JSON出力の制約
- **impressionDimensions**: 作品全体の評価を基準とし、その楽章特有の性格（例：アレグロ楽章なら情動性や規模感が高め、アダージョなら親密感が高い等）を相対的に反映させてください。
- **instruments**: 特別な指示（例：この楽章のみトロンボーンが入る等）がない限り、親作品の編成を継承してください。
- **Slugの遵守**: 入力として与えられた \`workSlug\` および各楽章の \`slug\` を厳格に守ってください。エージェント側でスラグを生成・改変してはいけません。
- **数字の正規化**: タイトル等に含まれる数字は、日本語（ja）では原則としてアラビア数字（1, 2, 3...）を使用してください。
11. **タイトルの構成要素分解 (重要)**:
    - 楽章のタイトルを一つの文字列として作るのは禁止です。
    - **number**: 楽章番号（数値のみ。例: 1）。
    - **distinctiveTitle**: 固有の題名（例: "Allegro"）。ジャンル名や番号を含めないこと。
    - **nickname**: 愛称（例: "亡き王女のためのパヴァーヌ"、"月の光"）。
    - [Good] 正解: \`number: 1, distinctiveTitle: { "ja": "Allegro" }, nickname: null \`
`;

export class WorkPartDraftAgent {
  private agent: BaseAgent;

  constructor(config: { modelName: GeminiModelName }) {
    this.agent = new BaseAgent({
      modelName: config.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }

  /**
   * 楽曲のパーツ（楽章・曲目）をバッチ生成します。
   */
  async execute(
    workData: WorkDraft,
    targetParts: { title: string; order: number; type: string }[],
  ): Promise<{ parts: WorkPartDraft[] }> {
    const prompt = `以下の楽曲に含まれる楽章・曲目の詳細データを生成してください。

【親楽曲情報】
作曲家: ${workData.composerSlug}
作品名: (自動合成タイトル)
編成/時代: ${workData.instrumentation ?? ''} / ${workData.era}
全体の印象: ${JSON.stringify(workData.impressionDimensions)}

【生成対象のリスト】
${targetParts.map((p) => `- ${p.order}: ${p.title} (${p.type})`).join('\n')}

# 補足
- 各パーツの \`composerSlug\`, \`workSlug\`, および個別の \`slug\` は、入力されたスラグに基づいて正確に設定してください。
- 楽器編成は親作品と異なる場合（例：独奏楽章、特定の楽器の休み）のみ、適切に上書きしてください。`;

    return await this.agent.generateObject<{ parts: WorkPartDraft[] }>(
      prompt,
      WorkPartChunkDraftSchema,
      {
        metadataContext: (workData as Record<string, unknown>)._generatorMeta as Record<
          string,
          unknown
        >,
      },
    );
  }
}
