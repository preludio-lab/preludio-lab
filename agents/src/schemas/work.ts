import { z } from 'zod';
import {
  BasedOnDraftSchema,
  CatalogueDraftSchema,
  CommonDescriptions,
  EraDraftSchema,
  ImpressionDimensionsDraftSchema,
  InstrumentIdDraftSchema,
  InstrumentationFlagsDraftSchema,
  MusicalIdentityDraftSchema,
  TagIdDraftSchema,
  TitleComponentsDraftSchema,
} from './work-shared.js';
import {
  WorkMasterBaseSchema,
  WORK_MASTER_VERSION,
} from '@/application/work/master/work-master.schema.js';

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
        '楽曲全体の構造（ソナタ形式、変奏曲、組曲など）と、主要な調性や拍子の推移を特定してください。',
      ),
    instrumentationAnalysis: z
      .string()
      .describe(
        '必要な楽器編成を特定し、独奏・室内楽・管弦楽などのフラグ判定根拠を記述してください。',
      ),
    impressionAnalysis: z
      .string()
      .describe(
        '以下の6軸の印象評価（-10〜+10）について、根拠を整理してください。 (1)革新性: 伝統からの脱却度、(2)情動性: 感情の表出度（対 知的）、(3)民族性: 郷土色の強さ（対 普遍的）、(4)規模感: 響きの壮大さ（対 親密）、(5)複雑性: 構造の難解さ（対 簡潔）、(6)演劇性: 劇的・標題的性格（対 絶対音楽）。',
      ),
  })
  .describe('最終的なデータを出力する前の思考プロセス。');

/**
 * Workflow specialized Work Draft schema.
 */
export const WorkDraftSchema = WorkMasterBaseSchema.omit({
  titleComponents: true,
  description: true,
  basedOn: true,
  catalogues: true,
  instrumentationFlags: true,
  _schemaVersion: true,
  // Redefine flat musical identity fields via merge
  key: true,
  tempo: true,
  tempoTranslation: true,
  timeSignature: true,
  genres: true,
  bpm: true,
  metronomeUnit: true,
})
  .extend({
    titleComponents: TitleComponentsDraftSchema,
    catalogues: z.array(CatalogueDraftSchema).describe('作品番号・カタログ情報。'),
    era: EraDraftSchema.optional().describe(CommonDescriptions.era),
    compositionYear: z.number().optional().describe(CommonDescriptions.compositionYear),
    compositionPeriod: z.string().optional().describe(CommonDescriptions.compositionPeriod),
    instrumentation: z.string().optional().describe(CommonDescriptions.instrumentation),
    instruments: z.array(InstrumentIdDraftSchema).describe(CommonDescriptions.instruments),
    instrumentationFlags: InstrumentationFlagsDraftSchema,
    performanceDifficulty: z.number().optional().describe(CommonDescriptions.performanceDifficulty),
    impressionDimensions: ImpressionDimensionsDraftSchema.optional(),
    tags: z.array(TagIdDraftSchema).max(10).describe(CommonDescriptions.tags),
    nicknames: z.array(z.string()).describe(CommonDescriptions.nicknames),
    basedOn: BasedOnDraftSchema.optional(),
    description: z
      .string()
      .optional()
      .describe(
        '60〜80文字で、検索結果や一覧画面からユーザーが「詳細な解説を読みたくなる」洗練された紹介文（SEO最適化）を作成してください。(1)客観的輪郭（作曲年、通称、歴史的背景などの事実）、(2)魅力の核心（聴覚体験や音楽的特徴）、(3)探求心の刺激（コントラストや構成美の提示）の3要素を自然な日本語（です・ます調）で凝縮すること。直接的な煽り（必聴です等）は避けてください。',
      ),
    _reasoning: WorkReasoningSchema,
  })
  .merge(MusicalIdentityDraftSchema.partial());

export type WorkDraft = z.infer<typeof WorkDraftSchema>;

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
});

export type WorkTranslationOutput = z.infer<typeof WorkTranslationOutputSchema>;
