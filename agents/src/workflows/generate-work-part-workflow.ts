import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { consola } from 'consola';
import { GeminiModels, type GeminiModelName } from '@/core/models.js';
import { WORKFLOW_RPM_WAIT_MS } from '@/core/constants.js';
import { WorkflowWorkPartMasterSchema, type WorkPartDraft } from '@/schemas/work-part.js';
import { type WorkDraft } from '@/schemas/work.js';
import { fileURLToPath } from 'node:url';
import { prune, deepMergeTranslation } from '@/shared/utils/json.js';
import { AgentDataWriterTool } from '@/tools/agent-data-writer.tool.js';

import { WorkPartDraftAgent } from '@/agents/work/part-draft-agent.js';
import { WorkRefineDraftAgent } from '@/agents/work/refine-draft-agent.js';
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
    return path.join(this.tempDir, `${workSlug}.parts.draft-refined.json`);
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
          await new Promise((r) => setTimeout(r, WORKFLOW_RPM_WAIT_MS));
        }
      }
    }

    const cleanedParts = allParts.map((p) => prune(p));

    const outPath = this.getDraftPath(input.workSlug);
    await fs.writeFile(outPath, JSON.stringify({ parts: cleanedParts }, null, 2), 'utf-8');
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

    const agent = new WorkRefineDraftAgent({ modelName });

    consola.info(`[Step: refine] Running consistency check...`);
    const refined = await agent.refineGlobalConsistency(
      parentWork as WorkDraft,
      targetParts as WorkPartDraft[],
    );
    targetParts = refined.parts as unknown[];

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

    for (let i = 0; i < targetLangs.length; i++) {
      const lang = targetLangs[i]!;
      consola.start(
        `[Step: translate] Translating into ${lang} (${i + 1}/${targetLangs.length})...`,
      );

      for (let j = 0; j < translatedParts.length; j++) {
        const transPart = await agent.translatePart(
          targetParts[j] as WorkPartDraft,
          lang,
          parentWork as WorkDraft,
        );
        translatedParts[j] = deepMergeTranslation(translatedParts[j], transPart, lang) as Record<
          string,
          unknown
        >;

        if (j < translatedParts.length - 1) {
          await new Promise((r) => setTimeout(r, 1000)); // Intra-chunk delay
        }
      }

      if (i < targetLangs.length - 1) {
        await new Promise((r) => setTimeout(r, WORKFLOW_RPM_WAIT_MS));
      }
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

    const writer = new AgentDataWriterTool(
      'workPartDataWriter',
      'WorkPartMasterDataをファイルシステムへ保存する',
      WorkflowWorkPartMasterSchema as unknown as z.AnyZodObject,
      partsDir,
      'slug',
      { prune: true },
    );

    for (const p of targetParts) {
      await writer.execute(p as z.infer<typeof WorkflowWorkPartMasterSchema>);
    }

    consola.success(
      `[Step: finalize] ${targetParts.length} WorkPart files persisted to ${partsDir}/`,
    );
  }

  private async loadAndParseJson(filePath: string): Promise<unknown> {
    if (!fsSync.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
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
