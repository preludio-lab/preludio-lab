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
  fullName: z.string().describe('作曲家のフルネーム（例: ヨハネス・ブラームス）'),
  displayName: z.string().describe('カードや見出しで使用する表示名（例: ブラームス、J.S.バッハ）'),
  shortName: z
    .string()
    .describe('リストや索引で使用する短縮名（原則として苗字のみ、例: ブラームス）'),
  summary: z
    .string()
    .describe(
      '60〜100字程度の極めて洗練された紹介文。専門用語、生没年、出身地は禁止。 (1)通称/イメージ、(2)最大の魅力/功績、(3)代表作1〜2曲、の3要素のみを自然な日本語（です・ます調）で構成すること。',
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
        '専門用語を排し、(1)通称/イメージ、(2)魅力/功績、(3)代表作、の3要素を凝縮したミニマムなサマリーの構成案。',
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
  representativeInstruments: true,
  representativeGenres: true,
  birthDate: true,
  deathDate: true,
})
  .extend(DraftFieldsSchema.shape)
  .extend({
    _reasoning: ReasoningSchema,
    representativeInstruments: z
      .array(z.string())
      .describe(
        '代表的な楽器。作曲家自身が名手であった、または歴史的に重要視した楽器を最大5つまで選択。',
      )
      .default([]),
    representativeGenres: z
      .array(z.string())
      .describe(
        '代表ジャンル。リストから貢献度の高いものを最大5つ選択: [symphony, overture, tone-poem, opera, operetta, ballet, piano-concerto, violin-concerto, concerto-grosso, chamber-strings, sonata-duo, keyboard-solo, lied, song-cycle, mass-requiem, cantata, choral-others]。',
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
  fullName: z
    .string()
    .describe(
      'ターゲット言語における公式かつ最も一般的なフルネームの綴り。中国語や日本語などの漢字・カタカナ圏では、必ず音訳（phonetic transliteration）された現地表記を使用すること。',
    ),
  displayName: z.string().describe('ターゲット言語における標準的な教養のある表示名'),
  shortName: z.string().describe('ターゲット言語における一般的な短縮名（原則として姓のみ）'),
  summary: z
    .string()
    .describe(
      'ターゲット言語に翻訳・ローカライズされた要約。元の日本語ドラフトの「親密でミニマム」な構成（通称・魅力・代表作）を維持すること。',
    )
    .optional(),
});

export type TranslationOutput = z.infer<typeof TranslationOutputSchema>;
