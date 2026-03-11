import { z } from 'zod';
import {
  ComposerMasterSchema,
  COMPOSER_MASTER_VERSION,
} from '@/application/composer/master/composer-master.schema.js';

/**
 * Draft phase specialized schema.
 * Fields with MultiLanguageString are simplified to single strings (Japanese)
 * to focus the model's attention.
 */
export const DraftFieldsSchema = z.object({
  fullName: z.string().describe('作曲家の氏名（日本語フルネーム）'),
  displayName: z.string().describe('作曲家の表示用氏名（日本語、名字のみ等）'),
  shortName: z.string().describe('作曲家の短縮名（日本語、姓のみ等）'),
  summary: z
    .string()
    .describe(
      '音楽的魅力に焦点を当てた、SEOに強い100〜150文字程度の要約（日本語）。人物像ではなく、提供する音楽、サウンド、感動できるポイントを端的に記述すること。文章は必ず「です・ます調」で記述。',
    )
    .optional(),
});

/**
 * AIの思考プロセスを格納するスキーマ
 */
const ReasoningSchema = z
  .object({
    nameAnalysis: z
      .string()
      .describe(
        '原語でのフルネームを確認し、日本で最も一般的に使用されるカタカナ表記のフルネーム、一般的な表示名（例: J.S.バッハ）、および短縮名（姓のみ）を整理してください。',
      ),
    chronologyAndLocations: z
      .string()
      .describe(
        '生年月日、没年月日、および主要な活動拠点（出生地、没地、活躍した都市）を時系列で列挙し、それぞれの都市が現在どの国のISO 3166-1 alpha-2コードに属するかを確認してください。活動拠点 (places) は最大3つに絞り込んでください。',
      ),
    musicalContributions: z
      .string()
      .describe(
        '歴史的に最も重要な貢献を果たしたジャンルと楽器を特定し、それが指定されたEnumリストのどれに該当するかをマッピングしてください。',
      ),
    historicalContext: z
      .string()
      .describe('この作曲家の音楽史における最大の功績を事実に基づいて分析してください。'),
    eraClassification: z.string().describe('時代区分を決定した理由を記述してください。'),
    summaryStructure: z
      .string()
      .describe(
        '要約執筆のため、1)音楽的魅力の核、2)革新性、3)どのような気分で聴くべきか の3つのポイントを箇条書きで整理してください。',
      ),
  })
  .describe('最終的なデータを出力する前の思考プロセス。事実確認と分析をここで行うこと。');

/**
 * 日付文字列の共通制約
 */
const DateStringSchema = z
  .string()
  .describe('YYYY-MM-DD 形式の文字列（例: "1678-03-04"）。タイムゾーン情報は絶対に含めないこと。')
  .nullable()
  .optional();

export const ComposerDraftSchema = ComposerMasterSchema.omit({
  fullName: true,
  displayName: true,
  shortName: true,
  summary: true,
  representativeGenres: true,
  birthDate: true,
  deathDate: true,
})
  .extend(DraftFieldsSchema.shape)
  .extend({
    _reasoning: ReasoningSchema,
    representativeGenres: z
      .array(z.string())
      .describe(
        '代表ジャンル。必ず以下のリストから最も歴史的貢献度が高いものを最大5つまで選択すること: [symphony, overture, tone-poem, opera, operetta, ballet, piano-concerto, violin-concerto, concerto-grosso, chamber-strings, sonata-duo, keyboard-solo, lied, song-cycle, mass-requiem, cantata, choral-others]。注意: 例えばバロック期の協奏曲において、solo-concerto（独奏協奏曲）と concerto-grosso（合奏協奏曲）は歴史的事実に基づいて厳密に区別すること。',
      )
      .default([]),
    birthDate: DateStringSchema,
    deathDate: DateStringSchema,
  });

export type ComposerDraft = z.infer<typeof ComposerDraftSchema>;

/**
 * Workflow output & persistence specialized schema.
 * Overrides Date types to strings to prevent T00:00:00Z suffix during JSON stringification.
 */
export const WorkflowComposerMasterSchema = ComposerMasterSchema.omit({
  birthDate: true,
  deathDate: true,
  _schemaVersion: true,
}).extend({
  birthDate: z.string().nullable().optional(),
  deathDate: z.string().nullable().optional(),
  _schemaVersion: z.string().default(COMPOSER_MASTER_VERSION),
});

export type WorkflowComposerMaster = z.infer<typeof WorkflowComposerMasterSchema>;

/**
 * Translation step specialized schema.
 */
export const TranslationOutputSchema = z.object({
  fullName: z.string().describe('翻訳されたフルネーム'),
  displayName: z.string().describe('翻訳された表示名'),
  shortName: z.string().describe('翻訳された短縮名'),
  summary: z.string().describe('翻訳された要約').optional(),
});

export type TranslationOutput = z.infer<typeof TranslationOutputSchema>;
