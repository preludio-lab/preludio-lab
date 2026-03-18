import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import {
  WorkDraft,
  WorkTranslationOutputSchema,
  type WorkTranslationOutput,
} from '@/schemas/work.js';
import {
  WorkPartDraft,
  WorkPartTranslationOutputSchema,
  type WorkPartTranslationOutput,
} from '@/schemas/work-part.js';

const SYSTEM_INSTRUCTION = `あなたは多言語対応のクラシック音楽サイトの翻訳・ローカライゼーションスペシャリストです。
楽曲ならびに楽章のデータを、ターゲット言語圏の聴衆にとって最も自然でプロフェッショナルな表現に翻訳してください。

# 守るべき基本原則
1. **音楽的コンテキストの尊重**: 楽曲の「時代区分」「楽器編成」「曲の性格」を考慮し、専門用語（演奏指示など）を音楽学的に正しく翻訳してください。
2. **ローカライズ・バイアスの排除**: 日本語での通称（例：運命、月光）に引きずられず、ターゲット言語圏での標準的な呼称（例：Fifth Symphony, Moonlight Sonata）を最優先してください。
3. **タイポグラフィの最適化**: 各言語の標準的な引用符（英: ' ', 仏: « », 中: 《 》）や正書法（独: ウムラウト、姓名の区切り等）を厳格に守ってください。
4. **演奏指示（Tempo Markings）のローカライズ**:
   - **イタリア語（標準的）**: イタリア語がそのまま専門用語として定着している場合はそれを尊重してください（例：EN/DE等では "Allegro"）。
   - **日本語 (JA)**: ご要望に基づき、標準的なイタリア語は「カタカナ音訳」とします（例："Allegro con brio" -> "アレグロ・コン・ブリオ"）。
   - **母国語表記/特殊指示**: 作曲家が母国語で記した指示（例：シューマンのドイツ語指示、ドビュッシーのフランス語指示）は、意訳としてターゲット言語のネイティブにとって最も自然で意味が通じる表現を選択してください。
5. **UI制約の継承**: 日本語ドラフトが持つ「情報の凝縮感（60-80文字程度）」を維持し、カードレイアウトを破壊しない簡潔な表現を心がけてください。

# 言語別の具体的な指示
- **EN**: 国際的な標準綴りを使用。作品タイトルは ' ' で囲む。
- **FR**: アクサン（é）やギュメ « » を厳守。人名や地名のフランス語綴りを優先。
- **DE**: ドイツ式引用符 „ “ を使用。J. S. Bach 等の姓名間のスペースを保持。
- **ZH**: 標準的な音訳漢字を使用。作品名は書名号 《 》 で囲む。姓名の区切りは「·」。`;

export class WorkTranslateAgent {
  private agent: BaseAgent;

  constructor(config: { modelName: GeminiModelName }) {
    this.agent = new BaseAgent({
      modelName: config.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }

  /**
   * 楽曲（Work）のメタデータを翻訳します。
   */
  async translateWork(workData: WorkDraft, targetLang: string): Promise<WorkTranslationOutput> {
    const prompt = `以下の楽曲データをターゲット言語「${targetLang}」へ翻訳・ローカライズしてください。

【入力データ (ja)】
- 作品名: ${workData.titleComponents.title}
- 補足/ニックネーム: ${workData.titleComponents.nickname ?? ''}
- 時代区分: ${workData.era}
- 楽器編成: ${workData.instrumentation ?? ''}
- 解説: ${workData.description ?? ''}

【制約】
- ターゲット言語圏の音楽事典や演奏会プログラムで用いられる、最も標準的でアカデミックな表現を採用すること。`;

    return await this.agent.generateObject<WorkTranslationOutput>(
      prompt,
      WorkTranslationOutputSchema,
    );
  }

  /**
   * 楽章（WorkPart）のメタデータを翻訳します。
   */
  async translatePart(
    partData: WorkPartDraft,
    targetLang: string,
    workContext: WorkDraft,
  ): Promise<WorkPartTranslationOutput> {
    const prompt = `以下の楽章データをターゲット言語「${targetLang}」へ翻訳・ローカライズしてください。

【親楽曲のコンテキスト】
- 曲名: ${workContext.titleComponents.title}
- 時代: ${workContext.era}

【入力パーツデータ (ja)】
- パーツ名: ${partData.titleComponents.title}
- 速度記号/補足: ${partData.titleComponents.content ?? ''}
- 解説: ${partData.description ?? ''}

【制約】
- 親楽曲との整合性を保ちつつ、楽章特有の用語（Allegro, Andante等）がターゲット言語圏でどう扱われているか（そのままイタリア語を残すか、現地語にするか等）を適切に判断してください。`;

    return await this.agent.generateObject<WorkPartTranslationOutput>(
      prompt,
      WorkPartTranslationOutputSchema,
    );
  }
}
