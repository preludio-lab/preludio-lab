import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import { WorkDraftSchema, type WorkDraft } from '@/schemas/work.js';
import { WorkPartDraftSchema, type WorkPartDraft } from '@/schemas/work-part.js';
import { normalizeWorkDraft } from './work-agent-utils.js';
import { z } from 'zod';
import { consola } from 'consola';

const SYSTEM_INSTRUCTION = `あなたは世界最高のクラシック音楽サイトのシニア・エディター兼音楽学者です。
生成された楽曲ならびに楽章のデータを精査し、不整合の解消、品質の向上、および人間からの指摘事項の反映を行ってください。

# 責務
1. **全体整合性の担保 (Cross-check)**: 楽曲本体（Work）の解説と、各楽章（Parts）の解説や音楽的分析に矛盾がないか確認してください。
2. **印象評価のキャリブレーション**: 作品全体の印象評価値（6軸）と、各楽章の評価値のバランスが適切か（例：作品全体は「壮大」なのに全楽章が「親密」になっていないか等）を確認し、修正してください。
3. **人間による指摘の反映**: プロデューサー等からの具体的な修正指示がある場合、それを最優先で反映してください。
4. **事実関係の再検証**: 作曲年や作品番号など、複数のパーツ間で記述が食い違っている場合は、最も信頼できる情報に統一してください。

# 修正のルール (極めて重要)
- **【超厳格】構造の完全維持**: 入力データの各フィールドの内部構造を絶対に崩さないでください。文字列への簡略化（Flattening）は「システムエラー」を引き起こします。
  - **多言語オブジェクト (i18n)**: \`description\`, \`compositionPeriod\`, \`titleComponents\` 等は、**絶対に文字列（"..."）で出力しないでください。** 必ず **\`{"ja": "..."}\` という Map/オブジェクト形式** を維持せよ。
  - **timeSignature**: 必ず \`{ "numerator": X, "denominator": Y }\` 形式を維持せよ。\`"4/4"\` などの文字列は禁止。
  - **genres / tags / instruments**: 必ず「文字列の配列」形式を維持せよ。\`"symphony"\` などの単一文字列は禁止。
  - **bpm / order / performanceDifficulty**: 必ず「数値（number）」を維持せよ。\`"120"\` などの引用符付き文字列は禁止。
  - **impressionDimensions**: 必ず各項目の数値キーを含むオブジェクト形式を維持せよ。
- **【Strictly Forbidden / 禁止】多楽章作品のWorkレベル項目**: 
  - 交響曲、協奏曲、ソナタ、室内楽曲、組曲などの多楽章作品において、**Workレベル（トップレベル）**に \`bpm\`, \`timeSignature\`, \`tempo\`, \`tempoTranslation\` などの演奏情報を出力することは **厳禁** です。
  - これらの情報は楽章（Parts）側で定義されるべきものであり、Workレベルでは原則として **null** としてください。
- **Slugの不変性**: 構造的な識別子として生成されたSlug（例: \`mov-1\`, \`var-1\`）は絶対に書き換えないでください。
- **品質向上**: \`description\` の「事実＋フック」構造を崩さず、より洗練された表現に磨き上げてください。`;

export class WorkRefineAgent {
  private agent: BaseAgent;

  constructor(config: { modelName: GeminiModelName }) {
    this.agent = new BaseAgent({
      modelName: config.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }

  /**
   * 楽曲全体の整合性を精査し、二段階で修正を行います。
   * 1. Workの整合性修正 (Partsをコンテキストとして参照)
   * 2. 各Partの整合性修正 (修正済みWorkをコンテキストとして参照)
   */
  async refineGlobalConsistency(
    workData: WorkDraft,
    partsData: WorkPartDraft[],
  ): Promise<{ work: WorkDraft; parts: WorkPartDraft[] }> {
    consola.info(`[WorkRefineAgent] Pass 1: Refining Work metadata...`);

    // Pass 1: Refine Work
    const workPrompt = `以下の楽曲(Work)と楽章(Parts)のリストを精査し、楽曲(Work)側のデータを全体の整合性が取れるように修正してください。
特に、各楽章の分析結果を受けて、楽曲全体の解説(description)や時代区分、印象評価を調整してください。

【対象の楽曲データ (Work)】
${JSON.stringify(workData, null, 2)}

【コンテキストとしての楽章リスト (Parts)】
${JSON.stringify(partsData, null, 2)}

# 修正のルール
- Workデータの構造（titleComponents, impressionDimensions等）を絶対に崩さないでください。
- 文字列への簡略化は厳禁です。`;

    const refinedWork = await this.agent.generateObject(workPrompt, WorkDraftSchema, {
      metadataContext: (workData as Record<string, unknown>)._generatorMeta as Record<
        string,
        unknown
      >,
    });

    const normalizedWork = normalizeWorkDraft(refinedWork as WorkDraft);

    consola.info(`[WorkRefineAgent] Pass 2: Refining Parts metadata...`);

    // Pass 2: Refine Parts (all together if small, or could be one-by-one)
    const partsPrompt = `修正済みの楽曲(Work)データに基づき、以下の楽章(Parts)リストを精査・修正してください。
各楽章の属性（調性、タグ、印象評価）が楽曲本体と矛盾していないか、また楽章間でのトーンが統一されているかを確認してください。

【修正済みの楽曲データ (Work)】
${JSON.stringify(normalizedWork, null, 2)}

【対象の楽章リスト (Parts)】
${JSON.stringify(partsData, null, 2)}

# 修正のルール
- 各楽章の構造（timeSignature, genres, impressionDimensions等）を十分に維持してください。
- 構造を解除して文字列（"4/4"等）にまとめ直すことは絶対に禁止です。`;

    const RefinedPartsSchema = z.object({
      parts: z.array(WorkPartDraftSchema),
    });

    const refinedPartsResult = await this.agent.generateObject(partsPrompt, RefinedPartsSchema, {
      metadataContext: (workData as Record<string, unknown>)._generatorMeta as Record<
        string,
        unknown
      >,
    });

    return {
      work: normalizedWork,
      parts: refinedPartsResult.parts,
    };
  }

  /**
   * 人間による個別のレビュー指摘を反映します。
   */
  async refineWithReview(
    targetData: WorkDraft | WorkPartDraft,
    review: string,
    isPart: boolean = false,
  ): Promise<WorkDraft | WorkPartDraft> {
    const prompt = `以下の${isPart ? '楽章' : '楽曲'}データに対して、以下のレビュー指摘を反映してください。

【レビュー指摘事項】
${review}

【現在のデータ】
${JSON.stringify(targetData, null, 2)}`;

    if (isPart) {
      return await this.agent.generateObject(prompt, WorkPartDraftSchema, {
        metadataContext: (targetData as Record<string, unknown>)._generatorMeta as Record<
          string,
          unknown
        >,
      });
    } else {
      const refined = await this.agent.generateObject(prompt, WorkDraftSchema, {
        metadataContext: (targetData as Record<string, unknown>)._generatorMeta as Record<
          string,
          unknown
        >,
      });
      return normalizeWorkDraft(refined as WorkDraft);
    }
  }
}
