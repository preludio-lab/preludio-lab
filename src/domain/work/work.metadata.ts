import { z } from '@/shared/validation/zod';
import { MusicalEraSchema } from '../shared/musical-era';
import {
  TitleSchema,
  DescriptionSchema,
  CompositionPeriodSchema,
  MusicalIdentitySchema,
  CatalogueSchema,
  PerformanceDifficultySchema,
  NicknamesSchema,
  ImpressionDimensionsSchema,
  TitleComponentsSchema,
} from './work.shared';
import { TagsSchema, YearSchema } from '../shared/common.metadata';

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
 * Work Metadata
 * 作品のメタデータ (多言語対応)
 */
export const WorkMetadataSchema = z.object({
  /** 正式名称 */
  title: TitleSchema,
  /** 通称 (e.g. "運命") */
  popularTitle: TitleSchema.optional(),
  /** タイトル構成要素 (prefix, content, nickname) */
  titleComponents: TitleComponentsSchema.optional(),

  /** カタログ情報 (作品番号等) */
  catalogue: CatalogueSchema.optional(),

  /** 作曲家 ID/Slug */
  composer: z.string().max(64).optional(),
  /** 時代区分 (Taxonomy準拠) */
  era: MusicalEraSchema.optional(),

  /**
   * 楽器編成 (テキスト記述 e.g. "Piano solo", "2.2.2.2 - 4.2.3.1 - tmp - str")
   * 編成は原則として作品全体で固定されるため、トップレベルで管理。
   */
  instrumentation: z.string().max(200).optional(),
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
  tags: TagsSchema,
  // parts: z.array(WorkPartSchema).max(100).default([]), // Phase 7: Promoted to standalone aggregate
});

export type WorkMetadata = z.infer<typeof WorkMetadataSchema>;
