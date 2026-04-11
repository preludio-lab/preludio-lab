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
        '作品の基本情報の事実（Fact）確認。正確な作曲年、カタログ番号（作品番号）、通し番号（何番か）、調性、固有の楽曲題名（幻想、くるみ割り人形等）、および愛称（運命、月光等）を、表示文字列とは別に「事実」として整理してください。',
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
    basedOn: BasedOnDraftSchema.optional().describe(
      '編曲・派生元情報。オリジナル作品（編曲でない）の場合は、情報を捏造せず、このフィールド自体を出力しないでください。',
    ),
    description: MultilingualDraftSchema.optional().describe(
      '【最重要】必ず {"ja": "..." } の形式で出力。70〜80文字で、一覧画面での「静謐さと気品」を両立した紹介文を作成してください。(1)音楽史的・生涯的な位置づけ（20字程度）、(2)音楽的本質の高解像度な描写（35字程度）、(3)読者の知的好奇心を刺激する独自の視点（20字程度）を凝縮すること。「本作品は〜」といった冗長な書き出しや宣伝的な煽り文句は厳禁。',
    ),
    _reasoning: WorkReasoningSchema,
  })
  .merge(MusicalIdentityDraftSchema.partial());

export type WorkDraft = z.infer<typeof WorkDraftSchema>;

/** 多言語対応（翻訳済み）データの精査用スキーマ */
const MultilingualFullSchema = z
  .object({
    ja: z.string(),
    en: z.string(),
    de: z.string(),
    fr: z.string(),
    it: z.string(),
    es: z.string(),
    zh: z.string(),
  })
  .describe('多言語オブジェクト。必ず ja, en, de, fr, it, es, zh のすべてのキーを含めてください。');

export const WorkMultilingualRefineSchema = WorkDraftSchema.extend({
  titleComponents: z
    .object({
      displayType: z
        .enum(['standard', 'catalogue-only', 'title-priority', 'custom'])
        .default('standard'),
      number: z.number().int().optional(),
      distinctiveTitle: MultilingualFullSchema.optional(),
      nickname: MultilingualFullSchema.optional(),
    })
    .describe('タイトル構成。各言語の翻訳を維持してください。'),
  compositionPeriod:
    MultilingualFullSchema.optional().describe('作曲時期。各言語の翻訳を維持してください。'),
  description: MultilingualFullSchema.optional().describe(
    '楽曲解説。各言語の翻訳を維持・精査してください。',
  ),
  tempoTranslation: MultilingualFullSchema.nullable()
    .optional()
    .describe('速度記号の訳。各言語の翻訳を維持してください。'),
});

/** 多言語パッチ用の緩和されたスキーマ (修正が必要な言語のみの出力を許容) */
export const WorkMultilingualPatchSchema = z
  .object({
    titleComponents: z
      .object({
        distinctiveTitle: MultilingualFullSchema.partial().optional(),
        nickname: MultilingualFullSchema.partial().optional(),
      })
      .optional(),
    compositionPeriod: MultilingualFullSchema.partial().optional(),
    description: MultilingualFullSchema.partial().optional(),
    tempoTranslation: MultilingualFullSchema.partial().nullable().optional(),
  })
  .partial();

export type WorkMultilingualPatch = z.infer<typeof WorkMultilingualPatchSchema>;

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
    distinctiveTitle: z
      .string()
      .optional()
      .describe(
        '固有の楽曲題名の翻訳。純粋な文字列のみを出力し、オブジェクト（例: {"en": "..."}）を入れ子にしないこと。翻訳不要な場合は省略すること。',
      ),
    nickname: z
      .string()
      .optional()
      .describe(
        '愛称の翻訳。純粋な文字列のみを出力し、オブジェクトを入れ子にしないこと。翻訳不要な場合は省略すること。',
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
