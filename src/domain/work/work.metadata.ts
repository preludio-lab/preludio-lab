import { z } from '@/shared/validation/zod';
import { MusicalInstrumentSchema } from '../shared/musical-instrument';
import { MusicalEraSchema } from '../shared/musical-era';
import {
  DescriptionSchema,
  CompositionPeriodSchema,
  MusicalIdentitySchema,
  CatalogueSchema,
  PerformanceDifficultySchema,
  NicknamesSchema,
  ImpressionDimensionsSchema,
  TitleComponentsSchema,
  ArrangeTypeSchema,
} from './work.shared';
import { MusicalTagsSchema, YearSchema, SlugSchema } from '../shared/common.metadata';

// Re-export common types and schemas for convenience
export * from './work.shared';

/**
 * 楽器編成フラグ (検索・フィルタリング用)
 */
export const InstrumentationFlagsSchema = z.object({
  /** 独奏曲か */
  isSolo: z.boolean().default(false),
  /** 室内楽か */
  isChamber: z.boolean().default(false),
  /** 管弦楽曲か */
  isOrchestral: z.boolean().default(false),
  /** 合唱を伴うか */
  hasChorus: z.boolean().default(false),
  /** 声楽を伴うか (独唱等) */
  hasVocal: z.boolean().default(false),
});

/**
 * Work Metadata Base
 */
export const WorkMetadataBaseSchema = z.object({
  /** タイトル構成要素 (displayType, number, distinctiveTitle, nickname) */
  titleComponents: TitleComponentsSchema,

  /** カタログ情報リスト (作品番号等) */
  catalogues: z.array(CatalogueSchema).default([]),

  /** 作曲家 ID/Slug (基本的には WorkControl.composerSlug と一致させる) */
  composer: SlugSchema.optional(),
  /** 時代区分 (Taxonomy準拠) */
  era: MusicalEraSchema.optional(),

  /**
   * 楽器編成 (Instrumentation - Display Text)
   * 演奏に必要な楽器編成を「人間が読むためのテキスト」で記述します。
   * ※ MusicalInstrumentのIDリストではありません。慣習的な略記法や自然言語記述を用います。
   *
   * [記述例]
   * - 独奏曲: "Piano"
   * - 室内楽: "Violin, Piano", "String Quartet"
   * - 管弦楽曲 (略記): "2.2.2.2 - 4.2.3.0 - tmp - str"
   * - 協奏曲: "Solo: Piano, Orch: 1.2.0.2 - 2.0.0.0 - str"
   *
   * 編成は原則として作品全体で固定されるため、トップレベルで管理します。
   */
  instrumentation: z.string().max(200).optional(),
  /**
   * 使用楽器リスト (構造化データ)
   * 検索・フィルタリング用に、楽曲で使用される楽器のIDリストを保持します。
   * - 独奏・室内楽: 全ての楽器を列挙します。
   * - 管弦楽曲・協奏曲: ソロ楽器や特徴的な楽器（イングリッシュホルン、ピッコロ等）を優先して登録します。
   *   標準的な弦楽器なども可能な限り網羅することを推奨します。
   */
  instruments: z.array(MusicalInstrumentSchema).default([]),
  /** 楽器編成フラグ (フィルタリング用) */
  instrumentationFlags: InstrumentationFlagsSchema.default({
    isSolo: false,
    isChamber: false,
    isOrchestral: false,
    hasChorus: false,
    hasVocal: false,
  }),

  /** 演奏難易度 (Taxonomy準拠 1-5) */
  performanceDifficulty: PerformanceDifficultySchema.optional(),

  /** 音楽的アイデンティティ (代表的な値) */
  musicalIdentity: MusicalIdentitySchema.optional(),
  /** 感性・印象評価の6軸データ */
  impressionDimensions: ImpressionDimensionsSchema.optional(),

  /** 作曲年 (ソート用) */
  compositionYear: YearSchema.optional(),
  /** 作曲時期 (e.g. "1805年頃") */
  compositionPeriod: CompositionPeriodSchema.optional(),
  /** 検索用別名リスト */
  nicknames: NicknamesSchema.default([]),
  /** 作品解説 */
  description: DescriptionSchema.optional(),
  /** 自由タグ */
  tags: MusicalTagsSchema,
  /** 編曲・派生元情報 */
  basedOn: z
    .object({
      /** 原曲の Slug (Work/WorkPart) */
      originalWorkSlug: SlugSchema,
      /** 編曲・派生タイプ */
      arrangeType: ArrangeTypeSchema,
      /** 編曲者 (名前またはSlug) */
      arranger: z.string().max(100).optional(),
    })
    .optional(),
  // parts: z.array(WorkPartSchema).max(100).default([]), // Phase 7: Promoted to standalone aggregate
});

/**
 * Work Metadata (Refined)
 */
export const WorkMetadataSchema = WorkMetadataBaseSchema.superRefine((data, ctx) => {
  // isPrimary: true が複数存在しないことを確認
  const primaryCount = data.catalogues.filter((c) => c.isPrimary).length;
  if (primaryCount > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Primary catalogue must be at most one.',
      path: ['catalogues'],
    });
  }
});

export type WorkMetadata = z.infer<typeof WorkMetadataSchema>;
