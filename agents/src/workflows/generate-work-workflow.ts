import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { consola } from 'consola';
import { GeminiModels, type GeminiModelName } from '@/core/models.js';
import {
  WorkflowWorkMasterSchema,
  type WorkDraft,
  type WorkTranslationOutput,
} from '@/schemas/work.js';
import { fileURLToPath } from 'node:url';

import { WorkDraftAgent } from '@/agents/work/draft-agent.js';
import { WorkRefineAgent } from '@/agents/work/refine-agent.js';
import { WorkTranslateAgent } from '@/agents/work/translate-agent.js';

/**
 * 楽曲生成ワークフローの実行ステップ定義
 */
export const WORK_WORKFLOW_STEPS = {
  DRAFT: 'draft',
  REFINE: 'refine',
  TRANSLATE: 'translate',
  FINALIZE: 'finalize',
} as const;

export type WorkWorkflowStep = (typeof WORK_WORKFLOW_STEPS)[keyof typeof WORK_WORKFLOW_STEPS];

const StepEnumSchema = z.enum([
  WORK_WORKFLOW_STEPS.DRAFT,
  WORK_WORKFLOW_STEPS.REFINE,
  WORK_WORKFLOW_STEPS.TRANSLATE,
  WORK_WORKFLOW_STEPS.FINALIZE,
]);

/**
 * 楽曲生成ワークフローの入力スキーマ
 */
export const GenerateWorkInputSchema = z.object({
  composerSlug: z.string().min(1),
  composerName: z.string().min(1).optional(),
  workSlug: z.string().min(1),
  workTitle: z.string().min(1).optional(),
  step: StepEnumSchema.optional(),
  review: z.string().optional(),
  model: z.nativeEnum(GeminiModels).optional(),
  auto: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  force: z.boolean().default(false),
});

export type GenerateWorkInput = z.infer<typeof GenerateWorkInputSchema>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENT_ROOT = path.resolve(__dirname, '../../'); // agents/
const PROJECT_ROOT = path.resolve(AGENT_ROOT, '../'); // root/

export class GenerateWorkWorkflow {
  private tempDir = path.resolve(AGENT_ROOT, 'workspace/temp/works');
  private dataDir = path.resolve(PROJECT_ROOT, 'data/works');

  constructor() {
    if (!fsSync.existsSync(this.tempDir)) {
      fsSync.mkdirSync(this.tempDir, { recursive: true });
    }
    if (!fsSync.existsSync(this.dataDir)) {
      fsSync.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private getDraftPath(slug: string) {
    return path.join(this.tempDir, `${slug}.draft.json`);
  }
  private getRefinedPath(slug: string) {
    return path.join(this.tempDir, `${slug}.refined.json`);
  }
  private getTranslatedPath(slug: string) {
    return path.join(this.tempDir, `${slug}.translated.json`);
  }
  private getFinalPath(composerSlug: string, workSlug: string) {
    return path.join(this.dataDir, composerSlug, `${workSlug}.json`);
  }

  async execute(rawInput: unknown) {
    const input = GenerateWorkInputSchema.parse(rawInput);
    const startStep = input.step || WORK_WORKFLOW_STEPS.DRAFT;
    const modelName = input.model || GeminiModels.FLASH_LITE;

    // Fail-fast
    const finalPath = this.getFinalPath(input.composerSlug, input.workSlug);
    if (!input.force && fsSync.existsSync(finalPath)) {
      consola.warn(`[GenerateWorkWorkflow] Final data already exists: ${finalPath}`);
      return;
    }

    if (input.dryRun) {
      consola.success(`[GenerateWorkWorkflow] Dry-run mode. Skipping API calls.`);
      return;
    }

    let currentWork: unknown = null;

    const isStepActive = (step: WorkWorkflowStep) => {
      if (input.auto) {
        // Find if current step or previous steps are the startStep
        const steps = Object.values(WORK_WORKFLOW_STEPS);
        return steps.indexOf(step) >= steps.indexOf(startStep);
      }
      return step === startStep;
    };

    // ----- STEP 1: DRAFT -----
    if (isStepActive(WORK_WORKFLOW_STEPS.DRAFT)) {
      currentWork = await this.executeDraftStep(input, modelName);
      if (!input.auto) return;
    }

    // ----- STEP 2: REFINE -----
    if (isStepActive(WORK_WORKFLOW_STEPS.REFINE)) {
      currentWork = await this.executeRefineStep(input, modelName, currentWork);
      if (!input.auto) return;
    }

    // ----- STEP 3: TRANSLATE -----
    if (isStepActive(WORK_WORKFLOW_STEPS.TRANSLATE)) {
      if (input.auto && startStep !== WORK_WORKFLOW_STEPS.TRANSLATE) {
        consola.info(`Waiting 5 seconds before translation...`);
        await new Promise((r) => setTimeout(r, 5000));
      }
      currentWork = await this.executeTranslateStep(input, modelName, currentWork);
      if (!input.auto) return;
    }

    // ----- STEP 4: FINALIZE -----
    if (isStepActive(WORK_WORKFLOW_STEPS.FINALIZE)) {
      await this.executeFinalizeStep(input, currentWork);
    }
  }

  private async executeDraftStep(input: GenerateWorkInput, modelName: GeminiModelName) {
    if (!input.composerName || !input.workTitle) {
      throw new Error(
        `[Step: draft] Missing required arguments: --composer-name and --work-title are mandatory for drafting.`,
      );
    }
    consola.start(`[Step: draft] Generating metadata for ${input.workTitle}...`);

    // 1. Work-level Draft
    const workAgent = new WorkDraftAgent({ modelName });
    const workDraft = await workAgent.execute({
      composerName: input.composerName,
      composerSlug: input.composerSlug,
      workTitle: input.workTitle,
      slug: input.workSlug,
    });

    const { _reasoning: _, ...cleanWork } = workDraft;

    const result = this.prune({
      ...cleanWork,
      _generatorMeta: {
        model: modelName,
        generatedAt: new Date().toISOString(),
      },
    });

    // ドメイン知識に基づいたさらに厳格なクリーンアップ (Draftレベル)
    if (result && typeof result === 'object') {
      const res = result as Record<string, unknown> & { genres?: string[]; slug?: string };
      // 多楽章形式（公認）の場合は、Workレベルの演奏情報を強制削除
      const isMultiMovement =
        res.genres?.some((g: string) =>
          ['symphony', 'concerto', 'sonata', 'suite', 'mass', 'opera', 'oratorio'].includes(g),
        ) ||
        res.slug?.includes('concerto') ||
        res.slug?.includes('symphony');

      if (isMultiMovement) {
        delete res['tempo'];
        delete res['bpm'];
        delete res['timeSignature'];
        delete res['tempoTranslation'];
        delete res['metronomeUnit'];
      }

      // basedOn が不完全（原曲スラグがない）場合は削除
      const basedOn = res['basedOn'] as Record<string, unknown> | undefined;
      if (basedOn && !basedOn['originalWorkSlug']) {
        delete res['basedOn'];
      }
    }

    const outPath = this.getDraftPath(input.workSlug);
    await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
    consola.success(`[Step: draft] Saved draft to ${outPath}`);

    return workDraft;
  }

  private async executeRefineStep(
    input: GenerateWorkInput,
    modelName: GeminiModelName,
    work: unknown,
  ) {
    consola.start(`[Step: refine] Performing consistency cross-check and applying reviews...`);

    let targetWork = work;

    if (!targetWork) {
      const sourcePath = this.getDraftPath(input.workSlug);
      const draftObj = (await this.loadAndParseJson(sourcePath)) as WorkDraft;
      targetWork = draftObj;
    }

    const agent = new WorkRefineAgent({ modelName });

    if (input.review) {
      consola.info(`[Step: refine] Applying human review feedback...`);
      targetWork = (await agent.refineWithReview(
        targetWork as WorkDraft,
        input.review,
        false,
      )) as WorkDraft;
    } else {
      consola.info(`[Step: refine] Running automated global consistency cross-check...`);
      const refined = await agent.refineGlobalConsistency(targetWork as WorkDraft, []);
      targetWork = refined.work as WorkDraft;
    }

    const outPath = this.getRefinedPath(input.workSlug);
    await fs.writeFile(outPath, JSON.stringify(targetWork, null, 2), 'utf-8');
    consola.success(`[Step: refine] Saved refined data to ${targetWork}`);

    return targetWork;
  }

  private async executeTranslateStep(
    input: GenerateWorkInput,
    modelName: GeminiModelName,
    work: unknown,
  ) {
    consola.start(`[Step: translate] Translating metadata...`);

    let targetWork = work;

    if (!targetWork) {
      const sourcePath = fsSync.existsSync(this.getRefinedPath(input.workSlug))
        ? this.getRefinedPath(input.workSlug)
        : this.getDraftPath(input.workSlug);
      const sourceObj = (await this.loadAndParseJson(sourcePath)) as Record<string, unknown>;
      targetWork = sourceObj;
    }

    const agent = new WorkTranslateAgent({ modelName });
    const targetLangs = ['en', 'de', 'fr', 'it', 'es', 'zh'];
    let translatedWork = JSON.parse(JSON.stringify(targetWork));

    for (const lang of targetLangs) {
      consola.start(`[Step: translate] Translating into ${lang}...`);

      const workTrans = await agent.translateWork(
        targetWork as WorkDraft,
        lang,
        input.composerName,
      );
      translatedWork = this.mergeTranslation(translatedWork, workTrans, lang) as Record<
        string,
        unknown
      >;

      await new Promise((r) => setTimeout(r, 5000));
    }

    const outPath = this.getTranslatedPath(input.workSlug);
    await fs.writeFile(outPath, JSON.stringify(translatedWork, null, 2), 'utf-8');
    consola.success(`[Step: translate] Saved translated data to ${outPath}`);

    return translatedWork;
  }

  private async executeFinalizeStep(input: GenerateWorkInput, work: unknown) {
    consola.start(`[Step: finalize] Persisting work data...`);

    let targetJson = work;
    if (!targetJson) {
      targetJson = await this.loadAndParseJson(this.getTranslatedPath(input.workSlug));
    }

    const cleanedJson = this.prune(targetJson);
    const workData =
      cleanedJson && typeof cleanedJson === 'object' ? { ...(cleanedJson as object) } : {};
    delete (workData as Record<string, unknown>)['parts'];

    const finalWork = WorkflowWorkMasterSchema.parse(workData);

    const composerDir = path.join(this.dataDir, input.composerSlug);
    if (!fsSync.existsSync(composerDir)) {
      await fs.mkdir(composerDir, { recursive: true });
    }

    const workPath = path.join(composerDir, `${input.workSlug}.json`);
    await fs.writeFile(workPath, JSON.stringify(finalWork, null, 2), 'utf-8');
    consola.success(`[Step: finalize] Work Master Data persisted to ${workPath}`);
  }

  private prune(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      const prunedArr = obj.map((v) => this.prune(v)).filter((v) => v !== undefined && v !== null);
      return prunedArr.length > 0 ? prunedArr : undefined;
    }
    if (typeof obj === 'object' && obj !== null) {
      const newObj: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        const pruned = this.prune(value);
        if (
          pruned === undefined ||
          pruned === null ||
          pruned === '' ||
          pruned === 'none' ||
          pruned === 'なし' ||
          pruned === 'null' ||
          (Array.isArray(pruned) && pruned.length === 0)
        ) {
          continue;
        }
        newObj[key] = pruned;
      }
      return Object.keys(newObj).length > 0 ? newObj : undefined;
    }
    return obj;
  }

  private async loadAndParseJson(filePath: string): Promise<unknown> {
    if (!fsSync.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    const raw = await fs.readFile(filePath, 'utf-8');
    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new Error(`[JSONParseError] Failed to parse ${filePath}: ${(error as Error).message}`);
    }
  }

  private mergeTranslation(base: unknown, translated: unknown, lang: string): unknown {
    const result = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
    const trans = translated as WorkTranslationOutput;

    const setMultilingual = (
      obj: Record<string, unknown>,
      key: string,
      value: unknown,
      targetLang: string,
    ) => {
      // Data Sanitization
      if (value === undefined || value === null) return;
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        if (
          lower === 'undefined' ||
          lower === 'null' ||
          lower === '[object object]' ||
          lower === ''
        ) {
          return;
        }
      } else if (typeof value === 'object') {
        consola.warn(
          `[mergeTranslation] Object mixed in translation string for key ${key}: ${JSON.stringify(value)}`,
        );
        return; // skip dirty object to prevent [object Object] serialization
      } else {
        return;
      }

      const strValue = value as string;

      if (!obj[key]) {
        obj[key] = { [targetLang]: strValue };
        return;
      }
      if (typeof obj[key] === 'string') {
        const jaValue = obj[key] as string;
        obj[key] = {
          ja: jaValue,
          [targetLang]: strValue,
        };
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        (obj[key] as Record<string, string>)[targetLang] = strValue;
      }
    };

    // Title components
    if (trans.titleComponents) {
      const tc = (result['titleComponents'] || {}) as Record<string, unknown>;
      const transTC = trans.titleComponents as Record<string, string | undefined>;
      if (transTC['prefix']) setMultilingual(tc, 'prefix', transTC['prefix'], lang);
      if (transTC['content']) setMultilingual(tc, 'content', transTC['content'], lang);
      if (transTC['nickname']) setMultilingual(tc, 'nickname', transTC['nickname'], lang);
      result['titleComponents'] = tc;
    }

    // Description
    if (trans.description) {
      setMultilingual(result, 'description', trans.description, lang);
    }

    // Metadata
    if (trans.compositionPeriod) {
      setMultilingual(result, 'compositionPeriod', trans.compositionPeriod, lang);
    }
    if (trans.tempoTranslation) {
      setMultilingual(result, 'tempoTranslation', trans.tempoTranslation, lang);
    }

    return result;
  }
}

async function main() {
  try {
    const { values } = parseArgs({
      options: {
        'composer-slug': { type: 'string' },
        'composer-name': { type: 'string' },
        'work-slug': { type: 'string' },
        'work-title': { type: 'string' },
        parts: { type: 'string' },
        step: { type: 'string' },
        review: { type: 'string' },
        model: { type: 'string' },
        auto: { type: 'boolean', default: false },
        'dry-run': { type: 'boolean', default: false },
        force: { type: 'boolean', default: false },
      },
      strict: false,
    });

    if (!values['composer-slug'] || !values['work-slug']) {
      consola.error(
        `Usage: pnpm run workflow:work --composer-slug <slug> --work-slug <slug> [--composer-name <name> --work-title <title> for draft] [--model <model-name>]`,
      );
      process.exit(1);
    }

    const workflow = new GenerateWorkWorkflow();
    const input = {
      composerSlug: values['composer-slug'] as string,
      composerName: values['composer-name'] as string | undefined,
      workSlug: values['work-slug'] as string,
      workTitle: (values['work-title'] as string | undefined) || (values['work-slug'] as string),
      step: values.step as GenerateWorkInput['step'],
      review: values.review as string,
      model: values.model as GeminiModelName | undefined,
      auto: !!values.auto,
      dryRun: !!values['dry-run'],
      force: !!values.force,
    };

    await workflow.execute(input);
  } catch (error: unknown) {
    if (error instanceof Error) {
      consola.error(`[WorkflowError] ${error.message}`);
    } else {
      consola.error('[WorkflowError] Unknown error', error);
    }
    process.exit(1);
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFilePath) {
  Promise.resolve(main());
}
