import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { consola } from 'consola';
import { GeminiModels, type GeminiModelName } from '@/core/models.js';
import { WorkflowWorkMasterSchema, type WorkDraft } from '@/schemas/work.js';
import { WorkflowWorkPartMasterSchema, type WorkPartDraft } from '@/schemas/work-part.js';
import { fileURLToPath } from 'node:url';

import { WorkDraftAgent } from '@/agents/work/draft-agent.js';
import { WorkPartDraftAgent } from '@/agents/work/part-draft-agent.js';
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
 * 楽章（Part）の入力定義
 */
const PartInputSchema = z.object({
  title: z.string(),
  order: z.number(),
  type: z.string().default('movement'),
});

/**
 * 楽曲生成ワークフローの入力スキーマ
 */
export const GenerateWorkInputSchema = z.object({
  composerSlug: z.string().min(1),
  composerName: z.string().min(1),
  workSlug: z.string().min(1),
  workTitle: z.string().min(1),
  /** 楽章リスト (draft時のみ必須。未指定時は単一楽章曲として扱う) */
  parts: z.array(PartInputSchema).optional().default([]),
  step: StepEnumSchema.optional(),
  review: z.string().optional(),
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
    const modelName = GeminiModels.FLASH_LITE;

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

    let currentWork: any = null;
    let currentParts: any[] = [];

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
      ({ work: currentWork, parts: currentParts } = await this.executeDraftStep(input, modelName));
      if (!input.auto) return;
    }

    // ----- STEP 2: REFINE -----
    if (isStepActive(WORK_WORKFLOW_STEPS.REFINE)) {
      ({ work: currentWork, parts: currentParts } = await this.executeRefineStep(
        input,
        modelName,
        currentWork,
        currentParts,
      ));
      if (!input.auto) return;
    }

    // ----- STEP 3: TRANSLATE -----
    if (isStepActive(WORK_WORKFLOW_STEPS.TRANSLATE)) {
      if (input.auto && startStep !== WORK_WORKFLOW_STEPS.TRANSLATE) {
        consola.info(`Waiting 5 seconds before translation...`);
        await new Promise((r) => setTimeout(r, 5000));
      }
      currentWork = await this.executeTranslateStep(input, modelName, currentWork, currentParts);
      if (!input.auto) return;
    }

    // ----- STEP 4: FINALIZE -----
    if (isStepActive(WORK_WORKFLOW_STEPS.FINALIZE)) {
      await this.executeFinalizeStep(input, currentWork);
    }
  }

  private async executeDraftStep(input: GenerateWorkInput, modelName: GeminiModelName) {
    consola.start(`[Step: draft] Generating metadata for ${input.workTitle}...`);

    // 1. Work-level Draft
    const workAgent = new WorkDraftAgent({ modelName });
    const workDraft = await workAgent.execute({
      composerName: input.composerName,
      composerSlug: input.composerSlug,
      workTitle: input.workTitle,
      slug: input.workSlug,
    });

    // 2. Part-level Draft (Chunking)
    let allParts: WorkPartDraft[] = [];
    if (input.parts.length > 0) {
      const partAgent = new WorkPartDraftAgent({ modelName });
      const chunkSize = 5;
      for (let i = 0; i < input.parts.length; i += chunkSize) {
        const chunk = input.parts.slice(i, i + chunkSize);
        consola.info(`[Step: draft] Generating parts chunk ${Math.floor(i / chunkSize) + 1}...`);
        const chunkResult = await partAgent.execute(workDraft, chunk);
        allParts = [...allParts, ...chunkResult.parts];

        // Wait to prevent rate limit
        if (i + chunkSize < input.parts.length) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    }

    const { _reasoning: _, ...cleanWork } = workDraft;
    const cleanParts = allParts.map(({ _reasoning: __, ...p }) => p);

    const result = {
      ...cleanWork,
      parts: cleanParts,
      _generatorMeta: {
        model: modelName,
        generatedAt: new Date().toISOString(),
      },
    };

    const outPath = this.getDraftPath(input.workSlug);
    await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
    consola.success(`[Step: draft] Saved draft to ${outPath}`);

    return { work: workDraft, parts: allParts };
  }

  private async executeRefineStep(
    input: GenerateWorkInput,
    modelName: GeminiModelName,
    work: any,
    parts: any[],
  ) {
    consola.start(`[Step: refine] Performing consistency cross-check and applying reviews...`);

    let targetWork = work;
    let targetParts = parts;

    if (!targetWork) {
      const sourcePath = this.getDraftPath(input.workSlug);
      const draftObj = (await this.loadAndParseJson(sourcePath)) as any;
      targetWork = draftObj;
      targetParts = draftObj.parts || [];
    }

    const agent = new WorkRefineAgent({ modelName });

    if (input.review) {
      consola.info(`[Step: refine] Applying human review feedback...`);
      targetWork = await agent.refineWithReview(targetWork, input.review, false);
    } else {
      consola.info(`[Step: refine] Running automated global consistency cross-check...`);
      const refined = await agent.refineGlobalConsistency(targetWork, targetParts);
      targetWork = refined.work;
      targetParts = refined.parts;
    }

    const result = { ...targetWork, parts: targetParts };
    const outPath = this.getRefinedPath(input.workSlug);
    await fs.writeFile(outPath, JSON.stringify(result, null, 2), 'utf-8');
    consola.success(`[Step: refine] Saved refined data to ${outPath}`);

    return { work: targetWork, parts: targetParts };
  }

  private async executeTranslateStep(
    input: GenerateWorkInput,
    modelName: GeminiModelName,
    work: any,
    parts: any[],
  ) {
    consola.start(`[Step: translate] Translating metadata...`);

    let targetWork = work;
    let targetParts = parts;

    if (!targetWork) {
      const sourcePath = fsSync.existsSync(this.getRefinedPath(input.workSlug))
        ? this.getRefinedPath(input.workSlug)
        : this.getDraftPath(input.workSlug);
      const sourceObj = (await this.loadAndParseJson(sourcePath)) as any;
      targetWork = sourceObj;
      targetParts = sourceObj.parts || [];
    }

    const agent = new WorkTranslateAgent({ modelName });
    const targetLangs = ['en', 'de', 'fr', 'it', 'es', 'zh'];
    let translatedWork = JSON.parse(JSON.stringify(targetWork));

    for (const lang of targetLangs) {
      consola.start(`[Step: translate] Translating into ${lang}...`);

      const workTrans = await agent.translateWork(targetWork, lang);
      translatedWork = this.mergeTranslation(translatedWork, workTrans, lang);

      if (targetParts && targetParts.length > 0) {
        const translatedParts = [];
        for (const p of targetParts) {
          const partTrans = await agent.translatePart(p as any, lang, targetWork as any);
          translatedParts.push(this.mergeTranslation(p, partTrans, lang));
          await new Promise((r) => setTimeout(r, 1000));
        }
        translatedWork.parts = translatedParts;
      }

      await new Promise((r) => setTimeout(r, 5000));
    }

    const outPath = this.getTranslatedPath(input.workSlug);
    await fs.writeFile(outPath, JSON.stringify(translatedWork, null, 2), 'utf-8');
    consola.success(`[Step: translate] Saved translated data to ${outPath}`);

    return translatedWork;
  }

  private async executeFinalizeStep(input: GenerateWorkInput, work: any) {
    consola.start(`[Step: finalize] Persisting work data...`);

    let targetJson = work;
    if (!targetJson) {
      targetJson = await this.loadAndParseJson(this.getTranslatedPath(input.workSlug));
    }

    // 最終バリデーション前に多言語フィールドを強制的にオブジェクト化
    const ensureMultilingual = (obj: any) => {
      if (!obj) return;

      // Description
      if (typeof obj.description === 'string') {
        obj.description = { ja: obj.description };
      }
      // Composition Period
      if (typeof obj.compositionPeriod === 'string') {
        obj.compositionPeriod = { ja: obj.compositionPeriod };
      }
      // Tempo Translation
      if (typeof obj.tempoTranslation === 'string') {
        obj.tempoTranslation = { ja: obj.tempoTranslation };
      }
      // Title Components
      if (obj.titleComponents) {
        ['title', 'prefix', 'content', 'nickname'].forEach((key) => {
          if (typeof obj.titleComponents[key] === 'string') {
            obj.titleComponents[key] = { ja: obj.titleComponents[key] };
          }
        });
      }
    };

    ensureMultilingual(targetJson);
    if (targetJson.parts) {
      targetJson.parts.forEach((p: any) => ensureMultilingual(p));
    }

    const workData = { ...targetJson };
    const parts = targetJson.parts || [];
    delete workData.parts;

    const finalWork = WorkflowWorkMasterSchema.parse(workData);

    const composerDir = path.join(this.dataDir, input.composerSlug);
    if (!fsSync.existsSync(composerDir)) {
      await fs.mkdir(composerDir, { recursive: true });
    }

    const workPath = path.join(composerDir, `${input.workSlug}.json`);
    await fs.writeFile(workPath, JSON.stringify(finalWork, null, 2), 'utf-8');
    consola.success(`[Step: finalize] Work Master Data persisted to ${workPath}`);

    // Persist WorkParts separately
    if (parts.length > 0) {
      const partsDir = path.join(composerDir, input.workSlug);
      if (!fsSync.existsSync(partsDir)) {
        await fs.mkdir(partsDir, { recursive: true });
      }

      for (const p of parts) {
        const finalPart = WorkflowWorkPartMasterSchema.parse(p);
        const partPath = path.join(partsDir, `${finalPart.slug}.json`);
        await fs.writeFile(partPath, JSON.stringify(finalPart, null, 2), 'utf-8');
      }
      consola.success(`[Step: finalize] ${parts.length} WorkPart files persisted to ${partsDir}/`);
    }
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

  private mergeTranslation(base: any, translated: any, lang: string): any {
    const result = JSON.parse(JSON.stringify(base));

    const setMultilingual = (obj: any, key: string, value: string, targetLang: string) => {
      if (!obj[key]) {
        obj[key] = { [targetLang]: value };
        return;
      }
      if (typeof obj[key] === 'string') {
        const jaValue = obj[key];
        obj[key] = {
          ja: jaValue,
          [targetLang]: value,
        };
      } else if (typeof obj[key] === 'object') {
        obj[key][targetLang] = value;
      }
    };

    // Title components
    if (translated.titleComponents) {
      const tc = result.titleComponents || {};
      if (translated.titleComponents.title)
        setMultilingual(tc, 'title', translated.titleComponents.title, lang);
      if (translated.titleComponents.prefix)
        setMultilingual(tc, 'prefix', translated.titleComponents.prefix, lang);
      if (translated.titleComponents.content)
        setMultilingual(tc, 'content', translated.titleComponents.content, lang);
      if (translated.titleComponents.nickname)
        setMultilingual(tc, 'nickname', translated.titleComponents.nickname, lang);
      result.titleComponents = tc;
    }

    // Description
    if (translated.description) {
      setMultilingual(result, 'description', translated.description, lang);
    }

    // Tempo translation (for work)
    if (translated.tempoTranslation) {
      setMultilingual(result, 'tempoTranslation', translated.tempoTranslation, lang);
    }

    // Parts
    if (translated.parts && result.parts && Array.isArray(translated.parts)) {
      for (let i = 0; i < translated.parts.length; i++) {
        const transPart = translated.parts[i];
        const basePart = result.parts[i];
        if (!transPart || !basePart) continue;

        // Part Title components
        if (transPart.titleComponents) {
          const ptc = basePart.titleComponents || {};
          if (transPart.titleComponents.title)
            setMultilingual(ptc, 'title', transPart.titleComponents.title, lang);
          if (transPart.titleComponents.prefix)
            setMultilingual(ptc, 'prefix', transPart.titleComponents.prefix, lang);
          if (transPart.titleComponents.content)
            setMultilingual(ptc, 'content', transPart.titleComponents.content, lang);
          if (transPart.titleComponents.nickname)
            setMultilingual(ptc, 'nickname', transPart.titleComponents.nickname, lang);
          basePart.titleComponents = ptc;
        }

        // Part Description
        if (transPart.description) {
          setMultilingual(basePart, 'description', transPart.description, lang);
        }

        // Part Tempo translation
        if (transPart.tempoTranslation) {
          setMultilingual(basePart, 'tempoTranslation', transPart.tempoTranslation, lang);
        }
      }
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
        auto: { type: 'boolean', default: false },
        'dry-run': { type: 'boolean', default: false },
        force: { type: 'boolean', default: false },
      },
      strict: false,
    });

    if (!values['composer-slug'] || !values['work-slug']) {
      consola.error(
        `Usage: pnpm run workflow:work --composer-slug <slug> --work-slug <slug> [...]`,
      );
      process.exit(1);
    }

    const parts = values.parts ? JSON.parse(values.parts as string) : [];

    const workflow = new GenerateWorkWorkflow();
    const input = {
      composerSlug: values['composer-slug'] as string,
      composerName: (values['composer-name'] as string) || (values['composer-slug'] as string),
      workSlug: values['work-slug'] as string,
      workTitle: (values['work-title'] as string) || (values['work-slug'] as string),
      parts,
      step: values.step as any,
      review: values.review as string,
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
