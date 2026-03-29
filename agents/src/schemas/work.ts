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
  MultilingualDraftSchema,
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
    compositionPeriod: MultilingualDraftSchema.optional().describe(
      '【最重要】必ず {"ja": "..."} の形式で出力してください。' +
        CommonDescriptions.compositionPeriod,
    ),
    instrumentation: z
      .string()
      .optional()
      .describe(
        '楽器編成のテキスト。例: "2.2.2.2 - 4.2.3.0 - tmp - str"。値がない場合はこのフィールド自体を出力しないでください。',
      ),
    instruments: z.array(InstrumentIdDraftSchema).describe(CommonDescriptions.instruments),
    instrumentationFlags: InstrumentationFlagsDraftSchema,
    performanceDifficulty: z.number().optional().describe(CommonDescriptions.performanceDifficulty),
    impressionDimensions: ImpressionDimensionsDraftSchema.optional(),
    tags: z.array(TagIdDraftSchema).max(10).describe(CommonDescriptions.tags),
    nicknames: z.array(z.string()).describe(CommonDescriptions.nicknames),
    basedOn: BasedOnDraftSchema.nullable()
      .optional()
      .describe(
        '編曲・派生元情報。オリジナル作品（編曲でない）の場合は、情報を捏造せず必ず null を出力してください。',
      ),
    description: MultilingualDraftSchema.optional().describe(
      '【最重要】必ず {"ja": "..." } の形式で出力してください。60〜80文字で、検索結果や一覧画面からユーザーが「詳細な解説を読みたくなる」洗練された紹介文（SEO最適化）を作成してください。(1)客観的輪郭、(2)魅力の核心、(3)探求心の刺激の3要素を凝縮すること。直接的な煽りは避けてください。',
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
  _reasoning: z
    .object({
      identityCheck: z
        .string()
        .describe('この曲は誰の何という曲か。絶対に他の作曲家や類似の有名楽曲と混同しないこと。'),
      languageCheck: z.string().describe('これから翻訳するターゲット言語は何か。'),
    })
    .describe('翻訳を行う前のセルフチェック（Chain of Thought）。'),
  titleComponents: z.object({
    prefix: z
      .string()
      .optional()
      .describe(
        '純粋な文字列のみを出力し、オブジェクト（例: {"en": "..."}）を入れ子にしないこと。該当なし・翻訳不要な場合はプロパティごと省略すること。',
      ),
    content: z
      .string()
      .optional()
      .describe(
        '純粋な文字列のみを出力し、オブジェクトを入れ子にしないこと。翻訳不要な場合は省略。',
      ),
    nickname: z
      .string()
      .optional()
      .describe(
        '純粋な文字列のみを出力し、オブジェクトを入れ子にしないこと。翻訳不要な場合は省略。',
      ),
  }),
  description: z
    .string()
    .optional()
    .describe('純粋な文字列のみを出力し、オブジェクトを入れ子にしないこと。翻訳不能な場合は省略。'),
  compositionPeriod: z
    .string()
    .optional()
    .describe('純粋な文字列のみを出力し、オブジェクトを入れ子にしないこと。翻訳不要な場合は省略。'),
  tempoTranslation: z
    .string()
    .optional()
    .describe(
      '純粋な文字列のみを出力し、オブジェクトを入れ子にしないこと。イタリア語等の速度記号の訳語。翻訳不要な場合は省略。',
    ),
});

export type WorkTranslationOutput = z.infer<typeof WorkTranslationOutputSchema>;
