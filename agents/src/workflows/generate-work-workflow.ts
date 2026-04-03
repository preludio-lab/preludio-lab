import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { consola } from 'consola';
import { GeminiModels, type GeminiModelName } from '@/core/models.js';
import { WORKFLOW_RPM_WAIT_MS } from '@/core/constants.js';
import { WorkflowWorkMasterSchema, type WorkDraft } from '@/schemas/work.js';
import { fileURLToPath } from 'node:url';
import { prune, deepMergeTranslation } from '@/shared/utils/json.js';
import { AgentDataWriterTool } from '@/tools/agent-data-writer.tool.js';

import { WorkDraftAgent } from '@/agents/work/draft-agent.js';
import { WorkRefineAgent } from '@/agents/work/refine-agent.js';
import { WorkTranslateAgent } from '@/agents/work/translate-agent.js';
import { normalizeWorkDraft } from '@/agents/work/work-agent-utils.js';

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
        consola.info(`Waiting for rate limit clearance (${WORKFLOW_RPM_WAIT_MS}ms)...`);
        await new Promise((r) => setTimeout(r, WORKFLOW_RPM_WAIT_MS));
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

    // 1. Work-level Draft Generation (Normalized inside agent)
    const workAgent = new WorkDraftAgent({ modelName });
    const workDraft = await workAgent.execute({
      composerName: input.composerName,
      composerSlug: input.composerSlug,
      workTitle: input.workTitle,
      slug: input.workSlug,
    });

    // 2. Final Normalization (Last line of defense before saving)
    const result = prune(normalizeWorkDraft(workDraft));

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
      targetWork = await this.loadAndParseJson(sourcePath);
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

    // Final Normalization (Last line of defense before saving)
    targetWork = normalizeWorkDraft(targetWork as WorkDraft);

    const outPath = this.getRefinedPath(input.workSlug);
    await fs.writeFile(outPath, JSON.stringify(targetWork, null, 2), 'utf-8');
    consola.success(`[Step: refine] Saved refined data to ${outPath}`);

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
      targetWork = await this.loadAndParseJson(sourcePath);
    }

    const agent = new WorkTranslateAgent({ modelName });
    const targetLangs = ['en', 'de', 'fr', 'it', 'es', 'zh'];
    let translatedWork = JSON.parse(JSON.stringify(targetWork));

    for (let i = 0; i < targetLangs.length; i++) {
      const lang = targetLangs[i]!;
      consola.start(
        `[Step: translate] Translating into ${lang} (${i + 1}/${targetLangs.length})...`,
      );

      const workTrans = await agent.translateWork(
        targetWork as WorkDraft,
        lang,
        input.composerName,
      );
      translatedWork = deepMergeTranslation(translatedWork, workTrans, lang);

      if (i < targetLangs.length - 1) {
        await new Promise((r) => setTimeout(r, WORKFLOW_RPM_WAIT_MS));
      }
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

    // WorkデータからParts（楽章リスト）を分離して単体Workとして保存
    const workData =
      targetJson && typeof targetJson === 'object' ? { ...(targetJson as object) } : {};
    delete (workData as Record<string, unknown>)['parts'];

    const composerDir = path.join(this.dataDir, input.composerSlug);
    const writer = new AgentDataWriterTool(
      'workDataWriter',
      'WorkMasterDataをファイルシステムへ保存する',
      WorkflowWorkMasterSchema as unknown as z.AnyZodObject,
      composerDir,
      'slug',
      { prune: true },
    );

    const finalPath = await writer.execute(workData as z.infer<typeof WorkflowWorkMasterSchema>);
    consola.success(`[Step: finalize] Work Master Data persisted to ${finalPath}`);
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
