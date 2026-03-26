import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { consola } from 'consola';
import { GeminiModels, type GeminiModelName } from '@/core/models.js';
import {
  WorkflowWorkPartMasterSchema,
  type WorkPartDraft,
  type WorkPartTranslationOutput,
} from '@/schemas/work-part.js';
import { type WorkDraft } from '@/schemas/work.js';
import { fileURLToPath } from 'node:url';

import { WorkPartDraftAgent } from '@/agents/work/part-draft-agent.js';
import { WorkRefineAgent } from '@/agents/work/refine-agent.js';
import { WorkTranslateAgent } from '@/agents/work/translate-agent.js';

/**
 * 楽章（WorkPart）生成ワークフローの実行ステップ定義
 */
export const WORK_PART_WORKFLOW_STEPS = {
  DRAFT: 'draft',
  REFINE: 'refine',
  TRANSLATE: 'translate',
  FINALIZE: 'finalize',
} as const;

export type WorkPartWorkflowStep =
  (typeof WORK_PART_WORKFLOW_STEPS)[keyof typeof WORK_PART_WORKFLOW_STEPS];

const StepEnumSchema = z.enum([
  WORK_PART_WORKFLOW_STEPS.DRAFT,
  WORK_PART_WORKFLOW_STEPS.REFINE,
  WORK_PART_WORKFLOW_STEPS.TRANSLATE,
  WORK_PART_WORKFLOW_STEPS.FINALIZE,
]);

/**
 * 楽章（Part）の入力定義
 */
const PartInputSchema = z.object({
  title: z.string(),
  order: z.number(),
  slug: z.string().min(1).describe('楽章のスラグ (例: "mov-1")'),
  type: z.string().default('movement'),
});

/**
 * 楽章生成ワークフローの入力スキーマ
 */
export const GenerateWorkPartInputSchema = z.object({
  composerSlug: z.string().min(1),
  workSlug: z.string().min(1),
  /** 楽章リスト (draft時のみ必須) */
  parts: z.array(PartInputSchema).optional().default([]),
  step: StepEnumSchema.optional(),
  review: z.string().optional(),
  auto: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  force: z.boolean().default(false),
});

export type GenerateWorkPartInput = z.infer<typeof GenerateWorkPartInputSchema>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENT_ROOT = path.resolve(__dirname, '../../'); // agents/
const PROJECT_ROOT = path.resolve(AGENT_ROOT, '../'); // root/

export class GenerateWorkPartWorkflow {
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

  private getDraftPath(workSlug: string) {
    return path.join(this.tempDir, `${workSlug}.parts.draft.json`);
  }
  private getRefinedPath(workSlug: string) {
    return path.join(this.tempDir, `${workSlug}.parts.refined.json`);
  }
  private getTranslatedPath(workSlug: string) {
    return path.join(this.tempDir, `${workSlug}.parts.translated.json`);
  }
  private getWorkPath(composerSlug: string, workSlug: string) {
    // 既存のWorkデータを親として参照する
    return path.join(this.dataDir, composerSlug, `${workSlug}.json`);
  }

  async execute(rawInput: unknown) {
    const input = GenerateWorkPartInputSchema.parse(rawInput);
    const startStep = input.step || WORK_PART_WORKFLOW_STEPS.DRAFT;
    const modelName = GeminiModels.FLASH_LITE;

    if (input.dryRun) {
      consola.success(`[GenerateWorkPartWorkflow] Dry-run mode. Skipping API calls.`);
      return;
    }

    let currentParts: unknown[] = [];

    const isStepActive = (step: WorkPartWorkflowStep) => {
      if (input.auto) {
        const steps = Object.values(WORK_PART_WORKFLOW_STEPS);
        return steps.indexOf(step) >= steps.indexOf(startStep);
      }
      return step === startStep;
    };

    // ----- STEP 1: DRAFT -----
    if (isStepActive(WORK_PART_WORKFLOW_STEPS.DRAFT)) {
      currentParts = await this.executeDraftStep(input, modelName);
      if (!input.auto) return;
    }

    // ----- STEP 2: REFINE -----
    if (isStepActive(WORK_PART_WORKFLOW_STEPS.REFINE)) {
      currentParts = await this.executeRefineStep(input, modelName, currentParts);
      if (!input.auto) return;
    }

    // ----- STEP 3: TRANSLATE -----
    if (isStepActive(WORK_PART_WORKFLOW_STEPS.TRANSLATE)) {
      currentParts = await this.executeTranslateStep(input, modelName, currentParts);
      if (!input.auto) return;
    }

    // ----- STEP 4: FINALIZE -----
    if (isStepActive(WORK_PART_WORKFLOW_STEPS.FINALIZE)) {
      await this.executeFinalizeStep(input, currentParts);
    }
  }

  private async executeDraftStep(input: GenerateWorkPartInput, modelName: GeminiModelName) {
    consola.start(`[Step: draft] Generating parts for ${input.workSlug}...`);

    const workPath = this.getWorkPath(input.composerSlug, input.workSlug);
    if (!fsSync.existsSync(workPath)) {
      throw new Error(`Parent Work not found: ${workPath}. Please generate Work first.`);
    }
    const parentWork = await this.loadAndParseJson(workPath);

    const partAgent = new WorkPartDraftAgent({ modelName });
    let allParts: WorkPartDraft[] = [];

    if (input.parts.length > 0) {
      const chunkSize = 5;
      for (let i = 0; i < input.parts.length; i += chunkSize) {
        const chunk = input.parts.slice(i, i + chunkSize);
        consola.info(`[Step: draft] Generating parts chunk ${Math.floor(i / chunkSize) + 1}...`);
        const chunkResult = await partAgent.execute(parentWork as WorkDraft, chunk);
        allParts = [...allParts, ...chunkResult.parts];

        if (i + chunkSize < input.parts.length) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    }

    const cleanParts = allParts.map(({ _reasoning: __, ...p }) =>
      this.prune({
        ...p,
        _generatorMeta: {
          model: modelName,
          generatedAt: new Date().toISOString(),
        },
      }),
    );

    const outPath = this.getDraftPath(input.workSlug);
    await fs.writeFile(outPath, JSON.stringify({ parts: cleanParts }, null, 2), 'utf-8');
    consola.success(`[Step: draft] Saved parts draft to ${outPath}`);

    return allParts;
  }

  private async executeRefineStep(
    input: GenerateWorkPartInput,
    modelName: GeminiModelName,
    parts: unknown[],
  ) {
    consola.start(`[Step: refine] Reviewing parts...`);

    let targetParts = parts;
    if (!targetParts || targetParts.length === 0) {
      const sourcePath = this.getDraftPath(input.workSlug);
      const draftObj = (await this.loadAndParseJson(sourcePath)) as { parts: WorkPartDraft[] };
      targetParts = (draftObj.parts || []) as unknown[];
    }

    const workPath = this.getWorkPath(input.composerSlug, input.workSlug);
    const parentWork = await this.loadAndParseJson(workPath);

    const agent = new WorkRefineAgent({ modelName });

    if (input.review) {
      consola.info(`[Step: refine] Applying review feedback to parts...`);
      // NOTE: WorkRefineAgent might need adjustment to handle multiple parts refinement with review
      // For now, we apply it individually or pass the whole set if the agent supports it.
      // Assuming refineGlobalConsistency is more appropriate for automated check.
      const refined = await agent.refineGlobalConsistency(
        parentWork as WorkDraft,
        targetParts as WorkPartDraft[],
      );
      targetParts = refined.parts as unknown[];
    } else {
      consola.info(`[Step: refine] Running automated consistency check...`);
      const refined = await agent.refineGlobalConsistency(
        parentWork as WorkDraft,
        targetParts as WorkPartDraft[],
      );
      targetParts = refined.parts as unknown[];
    }

    const outPath = this.getRefinedPath(input.workSlug);
    await fs.writeFile(outPath, JSON.stringify({ parts: targetParts }, null, 2), 'utf-8');
    consola.success(`[Step: refine] Saved refined parts to ${outPath}`);

    return targetParts;
  }

  private async executeTranslateStep(
    input: GenerateWorkPartInput,
    modelName: GeminiModelName,
    parts: unknown[],
  ) {
    consola.start(`[Step: translate] Translating parts...`);

    let targetParts = parts;
    if (!targetParts || targetParts.length === 0) {
      const sourcePath = fsSync.existsSync(this.getRefinedPath(input.workSlug))
        ? this.getRefinedPath(input.workSlug)
        : this.getDraftPath(input.workSlug);
      const sourceObj = (await this.loadAndParseJson(sourcePath)) as { parts: WorkPartDraft[] };
      targetParts = (sourceObj.parts || []) as unknown[];
    }

    const workPath = this.getWorkPath(input.composerSlug, input.workSlug);
    const parentWork = await this.loadAndParseJson(workPath);

    const agent = new WorkTranslateAgent({ modelName });
    const targetLangs = ['en', 'de', 'fr', 'it', 'es', 'zh'];

    // Create a copy to store translations multi-lingually
    const translatedParts = JSON.parse(JSON.stringify(targetParts)) as Record<string, unknown>[];

    for (const lang of targetLangs) {
      consola.start(`[Step: translate] Translating into ${lang}...`);

      for (let i = 0; i < translatedParts.length; i++) {
        const transPart = await agent.translatePart(
          targetParts[i] as WorkPartDraft,
          lang,
          parentWork as WorkDraft,
        );
        translatedParts[i] = this.mergeTranslation(translatedParts[i], transPart, lang) as Record<
          string,
          unknown
        >;
        await new Promise((r) => setTimeout(r, 1000));
      }

      await new Promise((r) => setTimeout(r, 3000));
    }

    const outPath = this.getTranslatedPath(input.workSlug);
    await fs.writeFile(outPath, JSON.stringify({ parts: translatedParts }, null, 2), 'utf-8');
    consola.success(`[Step: translate] Saved translated parts to ${outPath}`);

    return translatedParts;
  }

  async executeFinalizeStep(input: GenerateWorkPartInput, parts: unknown[]) {
    consola.start(`[Step: finalize] Persisting work parts...`);

    let targetParts = parts;
    if (!targetParts || targetParts.length === 0) {
      const sourceObj = (await this.loadAndParseJson(this.getTranslatedPath(input.workSlug))) as {
        parts: Record<string, unknown>[];
      };
      targetParts = (sourceObj.parts || []) as unknown[];
    }

    const composerDir = path.join(this.dataDir, input.composerSlug);
    const partsDir = path.join(composerDir, input.workSlug);
    if (!fsSync.existsSync(partsDir)) {
      await fs.mkdir(partsDir, { recursive: true });
    }

    for (const p of targetParts) {
      this.ensureMultilingual(p as Record<string, unknown>);
      const pruned = this.prune(p);
      const finalPart = WorkflowWorkPartMasterSchema.parse(pruned);
      const partPath = path.join(partsDir, `${finalPart.slug}.json`);
      await fs.writeFile(partPath, JSON.stringify(finalPart, null, 2), 'utf-8');
    }

    consola.success(
      `[Step: finalize] ${targetParts.length} WorkPart files persisted to ${partsDir}/`,
    );
  }

  private ensureMultilingual(obj: Record<string, unknown>) {
    if (!obj) return;
    if (typeof obj['description'] === 'string') obj['description'] = { ja: obj['description'] };
    if (typeof obj['tempoTranslation'] === 'string')
      obj['tempoTranslation'] = { ja: obj['tempoTranslation'] };
    if (obj['titleComponents'] && typeof obj['titleComponents'] === 'object') {
      const tc = obj['titleComponents'] as Record<string, unknown>;
      ['prefix', 'content', 'nickname'].forEach((key) => {
        if (typeof tc[key] === 'string') tc[key] = { ja: tc[key] };
      });
    }
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
    return JSON.parse(raw);
  }

  private mergeTranslation(base: unknown, translated: unknown, lang: string): unknown {
    const result = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
    const trans = translated as WorkPartTranslationOutput;

    const setMultilingual = (
      obj: Record<string, unknown>,
      key: string,
      value: string,
      targetLang: string,
    ) => {
      if (!obj[key]) {
        obj[key] = { [targetLang]: value };
        return;
      }
      if (typeof obj[key] === 'string') {
        const jaValue = obj[key] as string;
        obj[key] = { ja: jaValue, [targetLang]: value };
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        const field = obj[key] as Record<string, string>;
        field[targetLang] = value;
      }
    };

    if (trans.titleComponents) {
      const tc = (result['titleComponents'] || {}) as Record<string, unknown>;
      const transTC = trans.titleComponents as Record<string, string | undefined>;
      if (transTC['prefix']) setMultilingual(tc, 'prefix', transTC['prefix'], lang);
      if (transTC['content']) setMultilingual(tc, 'content', transTC['content'], lang);
      if (transTC['nickname']) setMultilingual(tc, 'nickname', transTC['nickname'], lang);
      result['titleComponents'] = tc;
    }

    if (trans.description) setMultilingual(result, 'description', trans.description, lang);
    if (trans.tempoTranslation)
      setMultilingual(result, 'tempoTranslation', trans.tempoTranslation, lang);

    return result;
  }
}

async function main() {
  try {
    const { values } = parseArgs({
      options: {
        'composer-slug': { type: 'string' },
        'work-slug': { type: 'string' },
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
        `Usage: pnpm run workflow:work-part --composer-slug <slug> --work-slug <slug> [...]`,
      );
      process.exit(1);
    }

    const parts = values.parts ? JSON.parse(values.parts as string) : [];

    const workflow = new GenerateWorkPartWorkflow();
    const input = {
      composerSlug: values['composer-slug'] as string,
      workSlug: values['work-slug'] as string,
      parts,
      step: values.step as GenerateWorkPartInput['step'],
      review: values.review as string,
      auto: !!values.auto,
      dryRun: !!values['dry-run'],
      force: !!values.force,
    };

    await workflow.execute(input);
  } catch (error: unknown) {
    if (error instanceof Error) consola.error(`[WorkflowError] ${error.message}`);
    process.exit(1);
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFilePath) {
  Promise.resolve(main());
}
