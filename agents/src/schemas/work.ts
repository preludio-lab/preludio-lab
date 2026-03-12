import { z } from 'zod';
import {
  WorkMasterBaseSchema,
  WORK_MASTER_VERSION,
} from '@/application/work/master/work-master.schema.js';
import { CatalogueSchema } from '@/domain/work/work.shared.js';

import { WorkPartDraftSchema } from './work-part.js';

/**
 * AIの思考プロセスを格納するスキーマ (Work用)
 */
export const WorkReasoningSchema = z
  .object({
    identityAnalysis: z
      .string()
      .describe(
        '作品の基本情報の事実確認。正確な作曲年、カタログ番号（作品番号）、調性、および一般的に親しまれている愛称などを整理してください。',
      ),
    historicalContext: z
      .string()
      .describe(
        'この楽曲の音楽史における意義、作曲の経緯、および同時代の作品との関係を分析してください。',
      ),
    structureAnalysis: z
      .string()
      .describe(
        '楽曲の全体構成（楽章数、曲目リスト）を特定してください。各要素のタイトル、標準的なテンポ指定、および役割（序奏、終曲など）を確認してください。',
      ),
    instrumentationAnalysis: z
      .string()
      .describe(
        '必要な楽器編成を特定し、独奏・室内楽・管弦楽などのフラグ判定根拠を記述してください。',
      ),
    impressionAnalysis: z
      .string()
      .describe('印象評価（6軸データ）を決定した理由を、音楽的特徴に基づいて記述してください。'),
  })
  .describe('最終的なデータを出力する前の思考プロセス。');

/**
 * Workflow specialized Work Draft schema.
 */
export const WorkDraftSchema = WorkMasterBaseSchema.omit({
  titleComponents: true,
  description: true,
  _schemaVersion: true,
}).extend({
  titleComponents: z.object({
    title: z.string().describe('作品の本題。日本語で入力してください（例: "交響曲第5番"）。'),
    prefix: z.string().optional().describe('接頭辞や言語別タイトル（例: "Symphony No. 5"）。'),
    content: z.string().optional().describe('内容（例: "ハ短調", "Op. 67"）。'),
    nickname: z.string().optional().describe('愛称・通称（例: "運命"）。'),
  }),
  description: z
    .string()
    .optional()
    .describe(
      '作品全体の概要・解説。歴史的背景や楽曲の独自性を2-3段落の日本語で記述してください。',
    ),
  parts: z.array(WorkPartDraftSchema).default([]),
  _reasoning: WorkReasoningSchema,
});

export type WorkDraft = z.infer<typeof WorkDraftSchema>;

/**
 * 作品の骨組み（構成案）のみを生成するためのスキーマ。
 * 大規模作品の第1段階（Structureフェーズ）で使用。
 */
export const WorkStructureSchema = z.object({
  _reasoning: WorkReasoningSchema,
  titleComponents: z.object({
    title: z.string().describe('作品の本題。日本語で入力してください。'),
    nickname: z.string().optional().describe('愛称・通称がある場合。'),
  }),
  compositionYear: z.number().optional().describe('（推測される）作曲年。'),
  catalogues: z.array(CatalogueSchema).default([]).describe('関連するカタログ番号リスト。'),
  partsOutline: z
    .array(
      z.object({
        slug: z.string().describe('楽章・曲目のURLスラグ案（例: "1st-mov", "overture"）。'),
        order: z.number().describe('表示順（1, 2, 3...）。'),
        title: z.string().describe('楽章・曲目のタイトル案。'),
        expectedTempo: z.string().optional().describe('想定されるテンポ指定。'),
      }),
    )
    .describe('楽曲を構成する楽章や曲目のリスト案、および構成の根拠。'),
});

export type WorkStructure = z.infer<typeof WorkStructureSchema>;

/**
 * Workflow output & persistence specialized schema.
 */
export const WorkflowWorkMasterSchema = WorkMasterBaseSchema.extend({
  _schemaVersion: z.string().default(WORK_MASTER_VERSION),
});

export type WorkflowWorkMaster = z.infer<typeof WorkflowWorkMasterSchema>;

/**
 * Translation step specialized schema.
 */
export const WorkTranslationOutputSchema = z.object({
  titleComponents: z.object({
    title: z.string(),
    prefix: z.string().optional(),
    content: z.string().optional(),
    nickname: z.string().optional(),
  }),
  description: z.string().optional(),
  tempoTranslation: z.string().optional(),
  parts: z.array(
    z.object({
      slug: z.string(),
      titleComponents: z.object({
        title: z.string(),
        prefix: z.string().optional(),
        content: z.string().optional(),
        nickname: z.string().optional(),
      }),
      description: z.string().optional(),
      tempoTranslation: z.string().optional(),
    }),
  ),
});

export type WorkTranslationOutput = z.infer<typeof WorkTranslationOutputSchema>;
