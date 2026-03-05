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
  COMPOSER_MASTER_VERSION,
} from '@/application/composer/master/composer-master.schema.js';
import { AppLocale } from '@/domain/i18n/locale.js';

/**
 * 作曲家生成ワークフローの実行ステップ定義
 * - draft: 基本情報の収集 (日本語のみ)
 * - refine: 人間によるレビュー内容の反映
 * - translate: 多言語翻訳
 * - finalize: 最終バリデーションとデータの永続化
 */
const StepEnumSchema = z.enum(['draft', 'refine', 'translate', 'finalize']);

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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENT_ROOT = path.resolve(__dirname, '../../'); // agents/
const PROJECT_ROOT = path.resolve(AGENT_ROOT, '../'); // root/

/**
 * Draft phase specialized schema.
 * Fields with MultiLanguageString are simplified to single strings (Japanese)
 * to focus the model's attention.
 */
const DraftFieldsSchema = z.object({
  fullName: z.string().describe('作曲家の氏名（日本語フルネーム）'),
  displayName: z.string().describe('作曲家の表示用氏名（日本語、名字のみ等）'),
  shortName: z.string().describe('作曲家の短縮名（日本語、姓のみ等）'),
  biography: z.string().describe('作曲家の人物紹介・略歴（日本語、500〜1000文字程度）').optional(),
});

const ComposerDraftSchema = ComposerMasterSchema.omit({
  fullName: true,
  displayName: true,
  shortName: true,
  biography: true,
}).extend(DraftFieldsSchema.shape);

type ComposerDraft = z.infer<typeof ComposerDraftSchema>;

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
   * ドラフト修正時などで人間が手動編集した際のエラー（カンマ抜け、カッコの閉じ忘れ等）を検知し、
   * トラブルシューティングしやすいエラーメッセージを提供する。
   *
   * @param filePath パース対象のJSONファイルパス
   * @returns パースされたJSONオブジェクト (unknown型)
   * @throws {Error} 未パース・フォーマットエラー時にスロー
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
   * 指定ステップ（draft -> refine -> translate -> finalize）からプロセスを開始する。
   *
   * @param rawInput ワークフロー実行パラメータ（未検証）
   */
  async execute(rawInput: unknown) {
    const input = GenerateComposerInputSchema.parse(rawInput);
    const startStep = input.step || 'draft';

    const isDraftOrAuto = startStep === 'draft' || input.auto;
    if (isDraftOrAuto && !input.name) {
      throw new Error(
        `[GenerateComposerWorkflow] '--name' is required when starting from 'draft' step or using '--auto'.`,
      );
    }

    // API呼び出しコストの節約・安全策 (Fail-Fast)
    // 最終マスターデータが既に存在する場合は、上書きによる消失・無駄なコストを避けるため早期リターンする
    if (!input.force && fsSync.existsSync(this.getFinalPath(input.slug))) {
      consola.warn(
        `[GenerateComposerWorkflow] Final persisted data already exists for ${input.slug}: ${this.getFinalPath(input.slug)}`,
      );
      consola.warn(
        `[GenerateComposerWorkflow] Workflow skipped to prevent accidental overwrite and API costs. Use --force to override.`,
      );
      return;
    }

    if (input.dryRun) {
      consola.success(
        `[GenerateComposerWorkflow] Dry-run: Validation successful for target ${input.slug} (Step: ${startStep}). Skipping API calls.`,
      );
      return;
    }

    const jsonConstraints = `
# JSON出力の型制約（厳守）
必ずJSON形式で出力し、以下の型制約を正確に守ること:
- impressionDimensions の各フィールド: -10から10の間の**整数（integer）**。例: -5, 0, 8。**"low", "medium", "high" などの文字列や、"7.5" などの小数は絶対に使用禁止。**
- places[].type: "birth", "death", "activity", "other" の4値のみ。
- _generatorMeta.confidenceScore: 0.0 から 1.0 の間の数値（例: 0.95）。1.0を超える値やパーセント表記は禁止。
- birthDate, deathDate: ISO 8601 形式（例: "1797-01-31"）。日付が不明な場合は null またはフィールド自体を省略。
- 各種スラグ (slug): 指定された既存のタクソノミー（ジャンル、場所等）に合致する小文字ケバブケースを使用すること。`;

    const systemInstruction = `あなたは世界最高のクラシック音楽サイトの専属プロデューサー・音楽学者です。
指定された作曲家に関する正確な史実と、音楽史における独自の解釈・評価を提供してください。
${jsonConstraints}`;

    let currentJson: ComposerMaster | null = null;

    // ----- STEP 1: DRAFT -----
    // 初期データの土台を作成するステップ。歴史的事実・代表作などを集め、ベースとなる日本語(ja)でのマスターデータを生成する
    if (startStep === 'draft' || input.auto) {
      const composerName = input.name as string;
      consola.start(
        `[Step: draft] Collecting background information for ${composerName} and generating primary Japanese master data...`,
      );

      const agent = new BaseAgent({
        modelName: GeminiModels.FLASH_LITE,
        systemInstruction,
      });

      const prompt = `作曲家 ${composerName} (スラッグ: ${input.slug}) のマスターデータを生成してください。
まずは歴史的背景や人物像、代表作を日本語で詳しく調査し、JSON として出力してください。

# 出力形式の注意
- fullName, displayName, shortName, biography フィールドは、オブジェクトではなく**「日本語の文字列」**として直接出力してください。
- その他のフィールド（era, birthDate, deathDate等）はスキーマの定義に従ってください。

# 出力例 (参考)
{
  "fullName": "ルードヴィヒ・ヴァン・ベートーヴェン",
  "displayName": "ベートーヴェン",
  "shortName": "ベートーヴェン",
  "era": "classical",
  "birthDate": "1770-12-16",
  "nationalityCode": "DE",
  "representativeInstruments": ["piano", "violin"],
  "representativeGenres": ["symphony", "piano-concerto", "sonata"],
  "impressionDimensions": {
    "innovation": 8,
    "emotionality": 9,
    "nationalism": 2,
    "scale": 10,
    "complexity": 7,
    "theatricality": 5
  },
  "slug": "beethoven",
  "_generatorMeta": {
    "model": "gemini-3.1-flash-lite",
    "generatedAt": "2024-07-27T12:00:00Z",
    "confidenceScore": 0.95,
    "sourceRefs": ["https://ja.wikipedia.org/wiki/ベートーヴェン"]
  }
}

# 重要な制約・ヒント (Taxonomy)
1. **era (時代)**: 以下から選択: medieval, renaissance, baroque, classical, early-romantic, mid-romantic, late-romantic, impressionism, modern, contemporary.
2. **impressionDimensions**: -10から10の整数。**数値のみ。文字列や記号（"+"等）は絶対禁止。自信がない場合は "0" を使用。**
3. **representativeGenres**: symphony, overture, opera, piano-concerto, chamber-strings, sonata-duo, keyboard-solo, lied, song-cycle, mass-requiem, choral-others 等。
4. **representativeInstruments**: piano, violin, cello, organ, flute, oboe, clarinet, bassoon, horn, trumpet, trombone, soprano, alto, tenor, bass, choir-mixed 等。
5. **places[].slug**: vienna, paris, london, rome, venice, milan, st-petersburg, warsaw, prague, budapest, berlin, leipzig, salzburg, bonn 等。
6. **_generatorMeta.sourceRefs**: 有効な "https://..." 形式。
7. **_generatorMeta.confidenceScore**: 0.0〜1.0 の範囲。`;

      const draftResult = await agent.generateObject<ComposerDraft>(
        prompt,
        ComposerDraftSchema as unknown as z.ZodType<ComposerDraft>,
      );

      // Draft 形式 (単一文字列) から Master 形式 (多言語オブジェクト) へ変換
      currentJson = {
        ...draftResult,
        _schemaVersion: COMPOSER_MASTER_VERSION,
        _generatorMeta: {
          ...draftResult._generatorMeta,
          model: GeminiModels.FLASH_LITE,
          generatedAt: new Date().toISOString(),
        },
        fullName: { [AppLocale.JA]: draftResult.fullName },
        displayName: { [AppLocale.JA]: draftResult.displayName },
        shortName: { [AppLocale.JA]: draftResult.shortName },
        biography: draftResult.biography ? { [AppLocale.JA]: draftResult.biography } : undefined,
      } as ComposerMaster;

      const outPath = this.getDraftPath(input.slug);
      await fs.writeFile(outPath, JSON.stringify(currentJson, null, 2), 'utf-8');
      consola.success(`[Step: draft] Saved initial draft to temporary file: ${outPath}`);

      if (!input.auto) {
        consola.info(
          `[GenerateComposerWorkflow] If you wish to proceed to the next phase, manually edit the generated JSON if needed, and run with --step=translate or --step=refine.`,
        );
        return;
      }
    }

    // ----- STEP 2: REFINE -----
    // 生成されたドラフトデータに対する非エンジニア(音楽の専門家・ディレクター)等からのレビュー指摘(prompt)を反映し、データを最適化する。
    // 手動で直接JSONを書き換えるのではなくLLM経由で再解釈・表現修正させるためのステップ。
    if (startStep === 'refine') {
      consola.start(`[Step: refine] Regenerating data based on human review comments...`);
      if (!input.review) {
        throw new Error(
          `[GenerateComposerWorkflow] '--review="..."' argument is mandatory for '--step=refine'.`,
        );
      }

      // レビューのベースとするデータを選択（前回の修正版が存在すればそれを、無ければ最初のドラフトを利用）
      const sourcePath = fsSync.existsSync(this.getRefinedPath(input.slug))
        ? this.getRefinedPath(input.slug)
        : this.getDraftPath(input.slug);

      if (!fsSync.existsSync(sourcePath)) {
        throw new Error(
          `[GenerateComposerWorkflow] Temporary file (draft or refined) not found. Please run '--step=draft' first: ${sourcePath}`,
        );
      }

      const draftObj = await this.loadAndParseJson(sourcePath);
      const draftData = ComposerMasterSchema.parse(draftObj);

      const agent = new BaseAgent({
        modelName: GeminiModels.FLASH_LITE,
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
      consola.success(`[Step: refine] Saved the refined data applying human review: ${outPath}`);

      if (!input.auto) {
        consola.info(
          `[GenerateComposerWorkflow] To proceed to the next phase, run with --step=translate.`,
        );
        return;
      }
    }

    // ----- STEP 3: TRANSLATE -----
    // 日本語(ja)で用意されたデータを基に多言語(en, de, fr, it, es, zh)の翻訳データを生成するステップ。
    // 多言語フィールド(MultilingualString)それぞれに、対象言語を含んだ情報をマージする。
    if (startStep === 'translate' || input.auto) {
      if (!currentJson) {
        // ステップがtranslateから開始された場合、ソースとなる一時ファイルを読み込む
        const sourcePath = fsSync.existsSync(this.getRefinedPath(input.slug))
          ? this.getRefinedPath(input.slug)
          : this.getDraftPath(input.slug);

        if (!fsSync.existsSync(sourcePath)) {
          throw new Error(
            `[GenerateComposerWorkflow] Temporary file not found. Run '--step=draft' or similar steps first: ${sourcePath}`,
          );
        }
        const rawData = await fs.readFile(sourcePath, 'utf-8');
        currentJson = ComposerMasterSchema.parse(JSON.parse(rawData));
      }

      consola.start(
        `[Step: translate] Translating Japanese data into multiple languages (en, de, fr, it, es, zh)...`,
      );

      const targetLangs = ['en', 'de', 'fr', 'it', 'es', 'zh'];

      // 無料枠のレートリミット（10 Requests Per Minute 等）を回避するため、
      // `Promise.all`による完全並列実行から、直列実行（Sequential）へ変更し、間にインターバルを設けます。
      const translationResults: { lang: string; data: ComposerMaster }[] = [];

      for (let i = 0; i < targetLangs.length; i++) {
        const lang = targetLangs[i];
        if (!lang) continue;
        consola.start(
          `[Step: translate] Translating into ${lang} (${i + 1}/${targetLangs.length})...`,
        );

        const TranslationOutputSchema = z.object({
          fullName: z.string().describe(`'${lang}' に翻訳されたフルネーム`),
          displayName: z.string().describe(`'${lang}' に翻訳された表示名`),
          shortName: z.string().describe(`'${lang}' に翻訳された短縮名`),
          biography: z.string().describe(`'${lang}' に翻訳された人物紹介・略歴`).optional(),
        });

        const agent = new BaseAgent({
          modelName: GeminiModels.FLASH_LITE,
          systemInstruction: `あなたは多言語対応のクラシック音楽サイトの翻訳スペシャリストです。指定された日本語(ja)のテキストを元に、指定されたターゲット言語(${lang})へ高品質な翻訳テキストを生成してください。専門用語や固有名詞は音楽史的に正確な名称を使用してください。`,
        });

        const prompt = `以下の日本語(ja)テキストについて、ターゲット言語 '${lang}' の翻訳を生成してください。
【翻訳元データ (ja)】
- fullName: ${currentJson?.fullName?.ja || ''}
- displayName: ${currentJson?.displayName?.ja || ''}
- shortName: ${currentJson?.shortName?.ja || ''}
- biography: ${currentJson?.biography?.ja || ''}`;

        const translatedStrings = await agent.generateObject<
          z.infer<typeof TranslationOutputSchema>
        >(prompt, TranslationOutputSchema);

        const translatedData = {
          fullName: { [lang]: translatedStrings.fullName },
          displayName: { [lang]: translatedStrings.displayName },
          shortName: { [lang]: translatedStrings.shortName },
          biography: translatedStrings.biography
            ? { [lang]: translatedStrings.biography }
            : undefined,
        } as unknown as ComposerMaster;

        translationResults.push({ lang, data: translatedData });

        // 最後の言語以外は、レートリミット対策として待機（例: 5秒）
        if (i < targetLangs.length - 1) {
          consola.info(`Waiting 5 seconds to prevent rate limit...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      /**
       * マージ用ヘルパー関数
       * ベースデータ(jaなどを含む元データ)と、今回翻訳された言語(lang)を含むデータを再帰的に探索し、
       * `MultilingualString` (実体は { ja: string } などのオブジェクト) に `lang: string` を追記する。
       *
       * @param base マージ先（元データ）
       * @param translated 翻訳された結果
       * @param lang 翻訳先の言語（例: 'en'）
       * @returns 再帰的にマージされた新しいオブジェクト構造
       */
      function mergeTranslation(base: unknown, translated: unknown, lang: string): unknown {
        if (!base || typeof base !== 'object') return base;
        // Date オブジェクトはスプレッドマージすると {} になってしまうため、そのまま返す
        if (base instanceof Date) return base;
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
      consola.success(
        `[Step: translate] Successfully saved translated multilingual data: ${outPath}`,
      );

      if (!input.auto) {
        consola.info(
          `[GenerateComposerWorkflow] To proceed to the next phase and finalize persistence, run with --step=finalize.`,
        );
        return;
      }
    }

    // ----- STEP 4: FINALIZE -----
    // マスターデータの最終バリデーションを実行し、`data/` 配下などの永続化用ディレクトリへ保存するステップ。
    if (startStep === 'finalize' || input.auto) {
      consola.start(
        `[Step: finalize] Performing final validation and persisting as master data...`,
      );

      if (!currentJson) {
        // 対象データメモリ上に存在しない場合、直前の翻訳済み結果をロード
        const sourcePath = this.getTranslatedPath(input.slug);
        if (!fsSync.existsSync(sourcePath)) {
          throw new Error(
            `[GenerateComposerWorkflow] Translated temporary file not found. Please run '--step=translate' first: ${sourcePath}`,
          );
        }
        const rawData = await fs.readFile(sourcePath, 'utf-8');
        currentJson = ComposerMasterSchema.parse(JSON.parse(rawData));
      }

      // 最終的に必要なすべてのデータがスキーマ仕様を満たしているか検証・整形
      const finalData = ComposerMasterSchema.parse(currentJson);

      const writer = new AgentDataWriterTool(
        'composerDataWriter',
        'ComposerMasterDataをファイルシステムへ保存する',
        ComposerMasterSchema as unknown as z.AnyZodObject,
        this.dataDir,
        'slug',
      );

      const finalPath = await writer.execute(finalData, { modelName: GeminiModels.FLASH_LITE });
      consola.success(
        `[Step: finalize] Composer Master Data successfully generated and persisted! -> ${finalPath}`,
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

    const step = values.step || 'draft';
    const isDraftOrAuto = step === 'draft' || values.auto;

    if (!values.slug || (isDraftOrAuto && !values.name)) {
      consola.error(
        `Usage: pnpm run workflow:composer --slug <slug> [--name <name>] [--step <step>] [--auto] [--dry-run]\n` +
          `Note: '--name' is required when starting from 'draft' step or using '--auto'.`,
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
