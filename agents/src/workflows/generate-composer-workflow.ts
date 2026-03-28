import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { consola } from 'consola';
import { GeminiModels, type GeminiModelName } from '@/core/models.js';
import { WORKFLOW_RPM_WAIT_MS } from '@/core/constants.js';
import { AgentDataWriterTool } from '@/tools/agent-data-writer.tool.js';
import {
  ComposerMasterSchema,
  type ComposerMaster,
  COMPOSER_MASTER_VERSION,
} from '@/application/composer/master/composer-master.schema.js';
import { WorkflowComposerMasterSchema, type ComposerDraft } from '@/schemas/composer.js';
import { AppLocale } from '@/domain/i18n/locale.js';
import { deepMergeTranslation } from '@/shared/utils/json.js';

import { ComposerDraftAgent } from '@/agents/composer/draft-agent.js';
import { ComposerRefineAgent } from '@/agents/composer/refine-agent.js';
import { ComposerTranslateAgent } from '@/agents/composer/translate-agent.js';

/**
 * 作曲家生成ワークフローの実行ステップ定義
 * - draft: 基本情報の収集 (日本語のみ)
 * - refine: 人間によるレビュー内容の反映
 * - translate: 多言語翻訳
 * - finalize: 最終バリデーションとデータの永続化
 */
export const COMPOSER_WORKFLOW_STEPS = {
  DRAFT: 'draft',
  REFINE: 'refine',
  TRANSLATE: 'translate',
  FINALIZE: 'finalize',
} as const;

export type ComposerWorkflowStep =
  (typeof COMPOSER_WORKFLOW_STEPS)[keyof typeof COMPOSER_WORKFLOW_STEPS];

const StepEnumSchema = z.enum([
  COMPOSER_WORKFLOW_STEPS.DRAFT,
  COMPOSER_WORKFLOW_STEPS.REFINE,
  COMPOSER_WORKFLOW_STEPS.TRANSLATE,
  COMPOSER_WORKFLOW_STEPS.FINALIZE,
]);

/**
 * 作曲家生成ワークフローの入力スキーマ
 */
export const GenerateComposerInputSchema = z.object({
  /** 対象作曲家のスラグ (例: beethoven) */
  slug: z.string().min(1),
  /** 作曲家のフルネーム表示名 (draft または auto=true 時に必須) */
  name: z.string().min(1).optional(),
  /** 実行を開始するターゲットステップ (デフォルト: draft) */
  step: StepEnumSchema.optional(),
  /** 'refine' ステップで使用される人間からのレビュー指摘 */
  review: z.string().optional(),
  /** true の場合、後続のステップへ自動で進む */
  auto: z.boolean().default(false),
  /** true の場合、API呼び出しやファイル書き込みを行わずに検証のみ実施 */
  dryRun: z.boolean().default(false),
  /** true の場合、既に最終データが存在していても強制的に再生成する */
  force: z.boolean().default(false),
});

/**
 * 作曲家生成ワークフローの入力型定義
 */
export type GenerateComposerInput = z.infer<typeof GenerateComposerInputSchema>;

import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENT_ROOT = path.resolve(__dirname, '../../'); // agents/
const PROJECT_ROOT = path.resolve(AGENT_ROOT, '../'); // root/

/**
 * Manage the AI workflow to generate, refine, translate, and persist
 * detailed data for a classical composer.
 */
export class GenerateComposerWorkflow {
  private tempDir = path.resolve(AGENT_ROOT, 'workspace/temp/composers');
  private dataDir = path.resolve(PROJECT_ROOT, 'data/composers');

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
  private getFinalPath(slug: string) {
    return path.join(this.dataDir, `${slug}.json`);
  }

  /**
   * 厳格な JSON パースとエラーハンドリングを行うヘルパー関数。
   */
  private async loadAndParseJson(filePath: string): Promise<unknown> {
    if (!fsSync.existsSync(filePath)) {
      throw new Error(`[GenerateComposerWorkflow] File not found: ${filePath}`);
    }
    const rawData = await fs.readFile(filePath, 'utf-8');
    try {
      return JSON.parse(rawData);
    } catch (error) {
      throw new Error(
        `[JSONParseError] Failed to parse ${filePath} as valid JSON. Check for syntax errors (e.g., missing commas, unclosed quotes) from manual edits.\nDetails: ${(error as Error).message}`,
      );
    }
  }

  /**
   * ワークフローを実行するメイン関数。
   */
  async execute(rawInput: unknown) {
    const input = GenerateComposerInputSchema.parse(rawInput);
    const startStep = input.step || COMPOSER_WORKFLOW_STEPS.DRAFT;

    const isDraftOrAuto = startStep === COMPOSER_WORKFLOW_STEPS.DRAFT || input.auto;
    if (isDraftOrAuto && !input.name) {
      throw new Error(
        `[GenerateComposerWorkflow] '--name' is required when starting from 'draft' step or using '--auto'.`,
      );
    }

    // API呼び出しコストの節約・安全策 (Fail-Fast)
    if (!input.force && fsSync.existsSync(this.getFinalPath(input.slug))) {
      consola.warn(
        `[GenerateComposerWorkflow] Final persisted data already exists for ${input.slug}: ${this.getFinalPath(input.slug)}`,
      );
      return;
    }

    if (input.dryRun) {
      consola.success(
        `[GenerateComposerWorkflow] Dry-run: Validation successful for target ${input.slug} (Step: ${startStep}). Skipping API calls.`,
      );
      return;
    }

    let currentJson: unknown = null;
    const modelName = GeminiModels.FLASH_LITE;

    // ----- STEP 1: DRAFT -----
    if (startStep === COMPOSER_WORKFLOW_STEPS.DRAFT || input.auto) {
      currentJson = await this.executeDraftStep(input, modelName);

      if (!input.auto) return;
    }

    // ----- STEP 2: REFINE -----
    if (startStep === COMPOSER_WORKFLOW_STEPS.REFINE) {
      currentJson = await this.executeRefineStep(input, modelName);

      if (!input.auto) return;
    }

    // ----- STEP 3: TRANSLATE -----
    if (startStep === COMPOSER_WORKFLOW_STEPS.TRANSLATE || input.auto) {
      if (input.auto && startStep !== COMPOSER_WORKFLOW_STEPS.TRANSLATE) {
        consola.info(`Waiting for rate limit clearance (${WORKFLOW_RPM_WAIT_MS}ms)...`);
        await new Promise((resolve) => setTimeout(resolve, WORKFLOW_RPM_WAIT_MS));
      }

      currentJson = await this.executeTranslateStep(input, modelName, currentJson);

      if (!input.auto) return;
    }

    // ----- STEP 4: FINALIZE -----
    if (startStep === COMPOSER_WORKFLOW_STEPS.FINALIZE || input.auto) {
      await this.executeFinalizeStep(input, currentJson);
    }
  }

  /**
   * STEP 1: DRAFT
   */
  private async executeDraftStep(
    input: GenerateComposerInput,
    modelName: GeminiModelName,
  ): Promise<unknown> {
    const composerName = input.name as string;
    consola.start(
      `[Step: draft] Collecting background information for ${composerName} and generating primary Japanese master data...`,
    );

    const agent = new ComposerDraftAgent({ modelName });
    const draftResult = await agent.execute(composerName, input.slug);

    // _reasoning フィールドの除去などは Writer 側で行うが、ここで Ja 構造への変換を行う
    const { _reasoning: _, ...draftData } = draftResult as ComposerDraft;

    const currentJson = {
      ...draftData,
      _schemaVersion: COMPOSER_MASTER_VERSION,
      fullName: { [AppLocale.JA]: draftData.fullName },
      displayName: { [AppLocale.JA]: draftData.displayName },
      shortName: { [AppLocale.JA]: draftData.shortName },
      summary: draftData.summary ? { [AppLocale.JA]: draftData.summary } : undefined,
    } as ComposerMaster;

    const outPath = this.getDraftPath(input.slug);
    await fs.writeFile(outPath, JSON.stringify(currentJson, null, 2), 'utf-8');
    consola.success(`[Step: draft] Saved initial draft to temporary file: ${outPath}`);

    return currentJson;
  }

  /**
   * STEP 2: REFINE
   */
  private async executeRefineStep(
    input: GenerateComposerInput,
    modelName: GeminiModelName,
  ): Promise<unknown> {
    consola.start(`[Step: refine] Regenerating data based on human review comments...`);
    if (!input.review) {
      throw new Error(
        `[GenerateComposerWorkflow] '--review="..."' argument is mandatory for '--step=refine'.`,
      );
    }

    const sourcePath = fsSync.existsSync(this.getRefinedPath(input.slug))
      ? this.getRefinedPath(input.slug)
      : this.getDraftPath(input.slug);

    const draftObj = await this.loadAndParseJson(sourcePath);
    const draftData = ComposerMasterSchema.parse(draftObj);

    const agent = new ComposerRefineAgent({ modelName });
    const refinedResult = await agent.execute(draftData, input.review);

    const outPath = this.getRefinedPath(input.slug);
    await fs.writeFile(outPath, JSON.stringify(refinedResult, null, 2), 'utf-8');
    consola.success(`[Step: refine] Saved the refined data applying human review: ${outPath}`);

    return refinedResult;
  }

  /**
   * STEP 3: TRANSLATE
   */
  private async executeTranslateStep(
    input: GenerateComposerInput,
    modelName: GeminiModelName,
    currentJson: unknown | null,
  ): Promise<unknown> {
    let targetJson = currentJson;
    if (!targetJson) {
      const sourcePath = fsSync.existsSync(this.getRefinedPath(input.slug))
        ? this.getRefinedPath(input.slug)
        : this.getDraftPath(input.slug);

      targetJson = await this.loadAndParseJson(sourcePath);
    }

    consola.start(
      `[Step: translate] Translating Japanese data into multiple languages (en, de, fr, it, es, zh)...`,
    );

    const targetLangs = ['en', 'de', 'fr', 'it', 'es', 'zh'];
    const agent = new ComposerTranslateAgent({ modelName });

    for (let i = 0; i < targetLangs.length; i++) {
      const lang = targetLangs[i]!;
      consola.start(
        `[Step: translate] Translating into ${lang} (${i + 1}/${targetLangs.length})...`,
      );

      const translatedStrings = await agent.execute(targetJson as ComposerMaster, lang);
      targetJson = deepMergeTranslation(targetJson, translatedStrings, lang) as ComposerMaster;

      if (i < targetLangs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, WORKFLOW_RPM_WAIT_MS));
      }
    }

    const outPath = this.getTranslatedPath(input.slug);
    await fs.writeFile(outPath, JSON.stringify(targetJson, null, 2), 'utf-8');
    consola.success(
      `[Step: translate] Successfully saved translated multilingual data: ${outPath}`,
    );

    return targetJson;
  }

  /**
   * STEP 4: FINALIZE
   */
  private async executeFinalizeStep(
    input: GenerateComposerInput,
    currentJson: unknown | null,
  ): Promise<void> {
    consola.start(`[Step: finalize] Performing final validation and persisting as master data...`);

    let targetJson = currentJson;
    if (!targetJson) {
      targetJson = await this.loadAndParseJson(this.getTranslatedPath(input.slug));
    }

    const writer = new AgentDataWriterTool(
      'composerDataWriter',
      'ComposerMasterDataをファイルシステムへ保存する',
      WorkflowComposerMasterSchema as unknown as z.AnyZodObject,
      this.dataDir,
      'slug',
      { prune: true },
    );

    const finalPath = await writer.execute(
      targetJson as z.infer<typeof WorkflowComposerMasterSchema>,
    );
    consola.success(
      `[Step: finalize] Composer Master Data successfully generated and persisted! -> ${finalPath}`,
    );
  }
}

async function main() {
  try {
    const { values } = parseArgs({
      options: {
        slug: { type: 'string' },
        name: { type: 'string' },
        step: { type: 'string' },
        review: { type: 'string' },
        auto: { type: 'boolean', default: false },
        'dry-run': { type: 'boolean', default: false },
        force: { type: 'boolean', default: false },
      },
      strict: false,
    });

    const step = values.step || COMPOSER_WORKFLOW_STEPS.DRAFT;
    const isDraftOrAuto = step === COMPOSER_WORKFLOW_STEPS.DRAFT || values.auto;

    if (!values.slug || (isDraftOrAuto && !values.name)) {
      consola.error(
        `Usage: pnpm run workflow:composer --slug <slug> [--name <name>] [--step <step>] [--auto] [--dry-run]\n` +
          `Note: '--name' is required when starting from 'draft' step or using '--auto'.`,
      );
      process.exit(1);
    }

    const workflow = new GenerateComposerWorkflow();
    const input = {
      slug: values.slug as string,
      name: values.name as string,
      step: values.step as GenerateComposerInput['step'],
      review: values.review as string,
      auto: !!values.auto,
      dryRun: !!values['dry-run'],
      force: !!values.force,
    };

    await workflow.execute(input);
  } catch (error: unknown) {
    if (error instanceof Error) {
      consola.error(
        `[WorkflowError] Failed to execute Composer generation workflow:\n${error.message}`,
      );
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
