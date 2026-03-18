import { z } from 'zod';
import {
  WorkPartMasterBaseSchema,
  WORK_PART_MASTER_VERSION,
} from '@/application/work/master/work-part-master.schema.js';
import {
  BasedOnDraftSchema,
  CatalogueDraftSchema,
  CommonDescriptions,
  ImpressionDimensionsDraftSchema,
  InstrumentIdDraftSchema,
  MusicalIdentityDraftSchema,
  TagIdDraftSchema,
  TitleComponentsDraftSchema,
} from './work-shared.js';

/**
 * AIの思考プロセスを格納するスキーマ (WorkPart用)
 */
export const WorkPartReasoningSchema = z
  .object({
    musicalAnalysis: z
      .string()
      .describe(
        'この楽章・曲目の音楽的特徴（主要主題、形式、ハーモニー、テンポ感など）を分析してください。',
      ),
    roleWithinWork: z
      .string()
      .describe('作品全体におけるこの楽章の役割や、前後の楽章との関係性を分析してください。'),
    impressionAnalysis: z
      .string()
      .describe(
        'この楽章固有の印象評価根拠。 (1)革新性、(2)情動性、(3)民族性、(4)規模感、(5)複雑性、(6)演劇性、の6軸について、作品全体との対比を意識して整理してください。',
      ),
  })
  .describe('個別の楽章・曲目を出力する前の思考プロセス。');

/**
 * Workflow specialized WorkPart Draft schema.
 */
export const WorkPartDraftSchema = WorkPartMasterBaseSchema.omit({
  titleComponents: true,
  description: true,
  tempoTranslation: true,
  basedOn: true,
  catalogues: true,
  _schemaVersion: true,
  // Redefine flat musical identity fields via merge
  key: true,
  tempo: true,
  timeSignature: true,
  genres: true,
  bpm: true,
  metronomeUnit: true,
  parts: true,
})
  .extend({
    composerSlug: z.string().describe('作曲家の識別子（例: "beethoven"）。'),
    workSlug: z.string().describe('親楽曲の識別子（例: "symphony-no-5"）。'),
    order: z.number().describe('楽章・曲目の表示順。第1楽章なら 1、第2楽章なら 2。'),
    type: z
      .string()
      .describe(
        '楽章・曲目の種類。例: "movement" (楽章), "variation" (変奏), "number" (小曲), "act" (幕)。',
      ),
    titleComponents: TitleComponentsDraftSchema,
    catalogues: z.array(CatalogueDraftSchema).describe('楽章固有の作品番号がある場合（稀）。'),
    instruments: z.array(InstrumentIdDraftSchema).describe(CommonDescriptions.instruments),
    performanceDifficulty: z.number().optional().describe(CommonDescriptions.performanceDifficulty),
    impressionDimensions: ImpressionDimensionsDraftSchema.optional(),
    tags: z.array(TagIdDraftSchema).max(10).describe(CommonDescriptions.tags),
    basedOn: BasedOnDraftSchema.optional(),
    description: z
      .string()
      .optional()
      .describe(
        '60〜80文字で、楽章・曲目の「詳細な解説を読みたくなる」簡潔な紹介文を作成してください。(1)客観的事実（テンポ感や形式）、(2)魅力の核心（主題の性格や響き）、(3)探求心の刺激（役割や対比の提示）を自然な日本語（です・ます調）で凝縮すること。情緒的な煽りを避け、音楽的な期待感を高めてください。',
      ),
    _reasoning: WorkPartReasoningSchema.optional(),
  })
  .merge(MusicalIdentityDraftSchema.partial());

export type WorkPartDraft = z.infer<typeof WorkPartDraftSchema>;

/**
 * Workflow output & persistence specialized schema (WorkPart).
 */
export const WorkflowWorkPartMasterSchema = WorkPartMasterBaseSchema.extend({
  _schemaVersion: z.string().default(WORK_PART_MASTER_VERSION),
});

export type WorkflowWorkPartMaster = z.infer<typeof WorkflowWorkPartMasterSchema>;

/**
 * チャンク分割生成時の出力スキーマ（楽章のリスト）。
 */
export const WorkPartChunkDraftSchema = z.object({
  parts: z.array(WorkPartDraftSchema),
});
/**
 * Translation step specialized schema (WorkPart).
 */
export const WorkPartTranslationOutputSchema = z.object({
  titleComponents: z.object({
    title: z.string(),
    prefix: z.string().optional(),
    content: z.string().optional(),
    nickname: z.string().optional(),
  }),
  description: z.string().optional(),
});

export type WorkPartTranslationOutput = z.infer<typeof WorkPartTranslationOutputSchema>;
