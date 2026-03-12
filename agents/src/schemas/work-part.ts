import { z } from 'zod';
import { WorkPartMasterBaseSchema } from '@/application/work/master/work-part-master.schema.js';

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
  })
  .describe('個別の楽章・曲目を出力する前の思考プロセス。');

/**
 * Workflow specialized WorkPart Draft schema.
 */
export const WorkPartDraftSchema = WorkPartMasterBaseSchema.omit({
  titleComponents: true,
  description: true,
  tempoTranslation: true,
  composerSlug: true,
  workSlug: true,
  _schemaVersion: true,
}).extend({
  titleComponents: z.object({
    title: z.string().describe('楽章・曲目の本題。日本語で入力してください。'),
    prefix: z
      .string()
      .optional()
      .describe('接頭辞（例: "第1楽章", "No. 1", "Act I"）。該当する場合のみ。'),
    content: z
      .string()
      .optional()
      .describe('内容や速度記号（例: "Allegro", "Andante", "ハ短調"）。'),
    nickname: z.string().optional().describe('愛称・通称がある場合、日本語で入力してください。'),
  }),
  description: z
    .string()
    .optional()
    .describe('楽曲解説。音楽的特徴や聴きどころを150-300文字程度の日本語で記述してください。'),
  tempoTranslation: z.string().optional().describe('テンポ指定や速度記号の日本語訳。'),
  _reasoning: WorkPartReasoningSchema.optional(),
});

/**
 * チャンク分割生成時の出力スキーマ（楽章のリスト）。
 */
export const WorkPartChunkDraftSchema = z.object({
  parts: z.array(WorkPartDraftSchema),
});
