import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import { WorkDraftSchema, type WorkDraft } from '@/schemas/work.js';
import { WorkPartDraftSchema, type WorkPartDraft } from '@/schemas/work-part.js';
import { normalizeWorkDraft } from './work-agent-utils.js';
import { z } from 'zod';
import { consola } from 'consola';

const SYSTEM_INSTRUCTION = `あなたは世界最高のクラシック音楽サイトのシニア・エディター兼音楽学者です。
生成された楽曲ならびに楽章のデータを精査し、不整合の解消、品質の向上、および人間からの指摘事項の反映を行ってください。
このフェーズ（refine-draft）では、主に日本語（ja）をベースとした情報の整合性と品質に集中してください。

# 責務
1. **全体整合性の担保 (Cross-check)**: 楽曲本体（Work）の解説と、各楽章（Parts）の解説や音楽的分析に矛盾がないか確認してください。
2. **印象評価のキャリブレーション**: 作品全体の印象評価値（6軸）と、各楽章の評価値のバランスが適切かを確認し、修正してください。
3. **人間による指摘の反映**: プロデューサー等からの具体的な修正指示がある場合、それを最優先で反映してください。
4. **事実関係の再検証**: 作曲年や作品番号など、複数のパーツ間で記述が食い違っている場合は、最も信頼できる情報に統一してください。

# 修正のルール (極めて重要)
- **【超厳格】構造の完全維持 (Data Loss Prevention)**: 
  - 入力データの各フィールドの内部構造を絶対に崩さないでください。文字列への簡略化（Flattening）は「システムエラー」を引き起こします。
  - **多言語オブジェクト (i18n)**: \`description\`, \`compositionPeriod\`, \`titleComponents\` 等は、**絶対に単一の文字列（"..."）で出力しないでください。**
  - **timeSignature**: 必ず \`{ "numerator": X, "denominator": Y }\` 形式を維持せよ。
  - **bpm / order / performanceDifficulty**: 必ず「数値（number）」を維持せよ。
- **【Strictly Forbidden / 禁止】多楽章作品のWorkレベル項目**: 
  - 交響曲、協奏曲、ソナタ、室内楽曲、組曲などの多楽章作品において、**Workレベル（トップレベル）**に \`bpm\`, \`timeSignature\`, \`tempo\`, \`tempoTranslation\` などの演奏情報は原則として **null** としてください。
- **【タイトル構成の要素分解】**: 
  - タイトルは必ず \`number\` (数値), \`distinctiveTitle\` (固有題名), \`nickname\` (愛称) の各フィールドに要素分解して保持してください。
- **品質向上**: \`description\` の「事実＋フック」構造を崩さず、より洗練された表現に磨き上げてください。`;

export class WorkRefineDraftAgent {
  private agent: BaseAgent;

  constructor(config: { modelName: GeminiModelName }) {
    this.agent = new BaseAgent({
      modelName: config.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }

  /**
   * 楽曲全体の整合性を精査し、二段階で修正を行います。
   */
  async refineGlobalConsistency(
    workData: WorkDraft,
    partsData: WorkPartDraft[],
  ): Promise<{ work: WorkDraft; parts: WorkPartDraft[] }> {
    consola.info(`[WorkRefineDraftAgent] Pass 1: Refining Work metadata...`);

    const workPrompt = `以下の楽曲(Work)と楽章(Parts)のリストを精査し、楽曲(Work)側のデータを全体の整合性が取れるように修正してください。

【対象の楽曲データ (Work)】
${JSON.stringify(workData, null, 2)}

【コンテキストとしての楽章リスト (Parts)】
${JSON.stringify(partsData, null, 2)}`;

    const refinedWork = await this.agent.generateObject(workPrompt, WorkDraftSchema, {
      metadataContext: (workData as Record<string, unknown>)._generatorMeta as Record<
        string,
        unknown
      >,
    });

    const normalizedWork = normalizeWorkDraft(refinedWork as WorkDraft);

    consola.info(`[WorkRefineDraftAgent] Pass 2: Refining Parts metadata...`);

    const partsPrompt = `修正済みの楽曲(Work)データに基づき、以下の楽章(Parts)リストを精査・修正してください。

【修正済みの楽曲データ (Work)】
${JSON.stringify(normalizedWork, null, 2)}

【対象の楽章リスト (Parts)】
${JSON.stringify(partsData, null, 2)}`;

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
   * 人間によるレビュー指摘を反映して推敲を行います。
   */
  async refineWithReview(
    workData: WorkDraft,
    review: string,
    _isMultilingual: boolean = false,
  ): Promise<WorkDraft> {
    consola.info(`[WorkRefineDraftAgent] Applying review feedback...`);

    const prompt = `以下の楽曲データに対して、人間によるレビュー指摘を反映した修正を行ってください。

【レビュー指摘事項】
${review}

【対象の楽曲データ】
${JSON.stringify(workData, null, 2)}`;

    const refined = await this.agent.generateObject(prompt, WorkDraftSchema, {
      metadataContext: (workData as Record<string, unknown>)._generatorMeta as Record<
        string,
        unknown
      >,
    });

    return normalizeWorkDraft(refined as WorkDraft);
  }
}
