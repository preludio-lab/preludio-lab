import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { consola } from 'consola';
import { BaseAgent } from '@/core/agent.js';
import { GeminiModels } from '@/core/models.js';
import { AgentDataWriterTool } from '@/tools/agent-data-writer.tool.js';
import {
  ComposerMasterSchema,
  type ComposerMaster,
} from '@/application/composer/master/composer-master.schema.js';

const StepEnumSchema = z.enum(['draft', 'refine', 'translate', 'finalize']);

export const GenerateComposerInputSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  step: StepEnumSchema.optional(),
  review: z.string().optional(),
  auto: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  force: z.boolean().default(false),
});

export type GenerateComposerInput = z.infer<typeof GenerateComposerInputSchema>;

export class GenerateComposerWorkflow {
  private tempDir = path.resolve(process.cwd(), 'agents/workspace/temp/composers');
  private dataDir = path.resolve(process.cwd(), 'data/composers');

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
   * 厳格な JSON パースとエラーハンドリングを行うヘルパー
   * 人間が手動編集した際のエラー（カンマ抜け等）を検知し、分かりやすいメッセージを出力する
   */
  private async loadAndParseJson(filePath: string): Promise<unknown> {
    if (!fsSync.existsSync(filePath)) {
      throw new Error(`ファイルが見つかりません: ${filePath}`);
    }
    const rawData = await fs.readFile(filePath, 'utf-8');
    try {
      return JSON.parse(rawData);
    } catch (error) {
      throw new Error(
        `[JSONParseError] ${filePath} が正しい JSON フォーマットとしてパースできませんでした。手動編集時の文法エラー（カンマ抜け、引用符の閉じ忘れ等）を確認してください。\nDetails: ${(error as Error).message}`,
      );
    }
  }

  async execute(rawInput: unknown) {
    const input = GenerateComposerInputSchema.parse(rawInput);
    const startStep = input.step || 'draft';

    // 冪等性の確認: 最終マスターデータが存在するかを引数パース直後に全ステップ共通で早期チェック (Fail-Fast)
    if (!input.force && fsSync.existsSync(this.getFinalPath(input.slug))) {
      consola.warn(
        `[GenerateComposerWorkflow] 永続化先データが既に存在します: ${this.getFinalPath(input.slug)}`,
      );
      consola.warn(
        `無駄なAPIコスト消費と上書きを防ぐため処理をスキップしました。強制実行する場合は --force を指定してください。`,
      );
      return;
    }

    if (input.dryRun) {
      consola.success(
        `[GenerateComposerWorkflow] Dry-run: 検証成功。対象: ${input.slug} (Step: ${startStep})。API呼び出しをスキップして終了します。`,
      );
      return;
    }

    const systemInstruction = `あなたは世界最高のクラシック音楽サイトの専属プロデューサー・音楽学者です。
指定された作曲家に関する正確な史実と、音楽史における独自の解釈・評価を提供してください。`;

    let currentJson: ComposerMaster | null = null;

    // ----- STEP 1: DRAFT -----
    if (startStep === 'draft' || input.auto) {
      consola.start(
        `[Step: draft] ${input.name} の背景情報を収集し、日本語マスターデータを生成しています...`,
      );

      const agent = new BaseAgent({
        modelName: GeminiModels.PRO,
        systemInstruction,
        enableGrounding: true,
      });

      const prompt = `作曲家 ${input.name} (スラッグ: ${input.slug}) のマスターデータを生成してください。
まずは歴史的背景や人物像、代表作を日本語(ja)で詳しく調査し、ComposerMasterSchema に合致する形の JSON として出力してください。
※他言語フィールド（en, frなど対象フィールド）は空のままにし、まずは ja フィールドのみを充実させてください。
（例: fullName: { ja: "ルードヴィヒ・ヴァン・ベートーヴェン" } のように）`;

      currentJson = await agent.generateObject<ComposerMaster>(
        prompt,
        ComposerMasterSchema as unknown as z.ZodType<ComposerMaster>,
      );

      const outPath = this.getDraftPath(input.slug);
      await fs.writeFile(outPath, JSON.stringify(currentJson, null, 2), 'utf-8');
      consola.success(`[Step: draft] 素案を一時ファイルに保存しました: ${outPath}`);

      if (!input.auto) {
        consola.info(
          `次フェーズへ進む場合は、必要に応じて生成されたJSONを手動修正後、--step=translate または --step=refine を実行してください。`,
        );
        return;
      }
    }

    // ----- STEP 2: REFINE -----
    if (startStep === 'refine') {
      consola.start(
        `[Step: refine] 人間のレビューコメントをもとにモデルがデータを再生成しています...`,
      );
      if (!input.review) {
        throw new Error(`--step=refine には --review="..." 引数が必須です。`);
      }

      const sourcePath = fsSync.existsSync(this.getRefinedPath(input.slug))
        ? this.getRefinedPath(input.slug)
        : this.getDraftPath(input.slug);

      if (!fsSync.existsSync(sourcePath)) {
        throw new Error(
          `一時ファイル(draft/refined)が見つかりません。先に --step=draft を実行してください: ${sourcePath}`,
        );
      }

      const draftObj = await this.loadAndParseJson(sourcePath);
      const draftData = ComposerMasterSchema.parse(draftObj);

      const agent = new BaseAgent({
        modelName: GeminiModels.PRO,
        systemInstruction,
      });

      const prompt = `以下の作曲家マスターデータ（素案）に対して、人間のプロデューサーから以下のレビュー指摘がありました。
指摘事項を反映して元のJSONデータを改善し、再度完全なJSONとして出力してください。

【レビュー指摘事項】
${input.review}

【現在のJSONデータ】
${JSON.stringify(draftData, null, 2)}`;

      currentJson = await agent.generateObject<ComposerMaster>(
        prompt,
        ComposerMasterSchema as unknown as z.ZodType<ComposerMaster>,
      );

      const outPath = this.getRefinedPath(input.slug);
      await fs.writeFile(outPath, JSON.stringify(currentJson, null, 2), 'utf-8');
      consola.success(`[Step: refine] レビューを反映した改善版データを保存しました: ${outPath}`);

      if (!input.auto) {
        consola.info(`次フェーズへ進む場合は --step=translate を実行してください。`);
        return;
      }
    }

    // ----- STEP 3: TRANSLATE -----
    if (startStep === 'translate' || input.auto) {
      if (!currentJson) {
        const sourcePath = fsSync.existsSync(this.getRefinedPath(input.slug))
          ? this.getRefinedPath(input.slug)
          : this.getDraftPath(input.slug);

        if (!fsSync.existsSync(sourcePath)) {
          throw new Error(
            `一時ファイルが見つかりません。先に --step=draft 等を実行してください: ${sourcePath}`,
          );
        }
        const rawData = await fs.readFile(sourcePath, 'utf-8');
        currentJson = ComposerMasterSchema.parse(JSON.parse(rawData));
      }

      consola.start(
        `[Step: translate] 日本語データを基に多言語(en, de, fr, it, es, zh)への翻訳を生成しています...`,
      );

      const targetLangs = ['en', 'de', 'fr', 'it', 'es', 'zh'];

      // Promise.allで言語ごとに独立した推論APIを並列実行
      const translationResults = await Promise.all(
        targetLangs.map(async (lang) => {
          const agent = new BaseAgent({
            modelName: GeminiModels.PRO,
            systemInstruction: `あなたは多言語対応のクラシック音楽サイトの翻訳スペシャリストです。指定されたJSONデータに含まれる日本語(ja)のテキストを元に、指定されたターゲット言語(${lang})へ高品質な翻訳テキストを生成し、対象言語のみを埋めたJSONを出力してください。専門用語や固有名詞は音楽史的に正確な名称を使用してください。`,
          });

          const prompt = `以下のマスターデータの多言語(MultilingualString)フィールドについて、ターゲット言語 '${lang}' の翻訳を生成した新しいJSONを出力してください。
【翻訳元データ (ja)】
${JSON.stringify(currentJson, null, 2)}`;

          const translatedData = await agent.generateObject<ComposerMaster>(
            prompt,
            ComposerMasterSchema as unknown as z.ZodType<ComposerMaster>,
          );
          return { lang, data: translatedData };
        }),
      );

      // マージ用ヘルパー関数: base に対して translated の該当言語(lang)のプロパティを再帰的にマージ
      function mergeTranslation(base: unknown, translated: unknown, lang: string): unknown {
        if (!base || typeof base !== 'object') return base;
        if (Array.isArray(base)) {
          const transArray = Array.isArray(translated) ? translated : [];
          return base.map((item, i) => mergeTranslation(item, transArray[i], lang));
        }
        const result = { ...base } as Record<string, unknown>;
        const transRecord = (
          translated && typeof translated === 'object' && !Array.isArray(translated)
            ? translated
            : {}
        ) as Record<string, unknown>;

        for (const key of Object.keys(base)) {
          const baseVal = result[key];
          if (baseVal && typeof baseVal === 'object' && !Array.isArray(baseVal)) {
            // MultilingualString (jaを持っているオブジェクト) の場合のみ指定されたlangの値をマージ
            if ('ja' in baseVal) {
              const multiObj = { ...baseVal } as Record<string, unknown>;
              result[key] = multiObj;
              const transMultiObj = transRecord[key] as Record<string, unknown> | undefined;
              if (transMultiObj?.[lang] !== undefined) {
                multiObj[lang] = transMultiObj[lang];
              }
            } else {
              result[key] = mergeTranslation(baseVal, transRecord[key], lang);
            }
          }
        }
        return result;
      }

      // ベースデータに対して全言語の生成結果をディープマージ
      for (const { lang, data } of translationResults) {
        currentJson = mergeTranslation(currentJson, data, lang) as ComposerMaster;
      }

      const outPath = this.getTranslatedPath(input.slug);
      await fs.writeFile(outPath, JSON.stringify(currentJson, null, 2), 'utf-8');
      consola.success(`[Step: translate] 翻訳済みの多言語データを保存しました: ${outPath}`);

      if (!input.auto) {
        consola.info(`次フェーズへ進む場合は --step=finalize を実行して永続化を完了してください。`);
        return;
      }
    }

    // ----- STEP 4: FINALIZE -----
    if (startStep === 'finalize' || input.auto) {
      consola.start(`[Step: finalize] 最終検証とマスターデータへの永続化を行います...`);

      if (!currentJson) {
        const sourcePath = this.getTranslatedPath(input.slug);
        if (!fsSync.existsSync(sourcePath)) {
          throw new Error(
            `翻訳済みの一時ファイルが見つかりません。先に --step=translate を実行してください: ${sourcePath}`,
          );
        }
        const rawData = await fs.readFile(sourcePath, 'utf-8');
        currentJson = ComposerMasterSchema.parse(JSON.parse(rawData));
      }

      // 最終バリデーション
      const finalData = ComposerMasterSchema.parse(currentJson);

      const writer = new AgentDataWriterTool(
        'composerDataWriter',
        'ComposerMasterDataをファイルシステムへ保存する',
        ComposerMasterSchema as unknown as z.AnyZodObject,
        this.dataDir,
        'slug',
      );

      const finalPath = await writer.execute(finalData, { modelName: GeminiModels.PRO });
      consola.success(
        `[Step: finalize] コンポーザーマスターの生成が完了しました！ -> ${finalPath}`,
      );
    }
  }
}

import { fileURLToPath } from 'node:url';

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

    if (!values.slug || !values.name) {
      consola.error(
        `Usage: pnpm exec tsx agents/src/workflows/generate-composer-workflow.ts --slug <slug> --name <name> [--step <step>] [--auto] [--dry-run]`,
      );
      process.exit(1);
    }

    const workflow = new GenerateComposerWorkflow();
    const input = {
      slug: values.slug,
      name: values.name,
      step: values.step,
      review: values.review,
      auto: values.auto,
      dryRun: values['dry-run'],
      force: values.force,
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
