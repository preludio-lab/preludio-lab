import { z } from '@/shared/validation/zod';
import { createMultilingualStringSchema } from '../i18n/Locale';
import { MusicalEraSchema } from '../shared/MusicalEra';
import {
  ResourcePathSchema,
  TagsSchema,
  PlaceSchema,
  DimensionSchema,
} from '../shared/CommonMetadata';
import { NationalitySchema } from '../shared/Nationality';
import { MusicalInstrumentSchema } from '../shared/MusicalInstrument';
import { MusicalGenreSchema } from '../work/MusicalGenre';

/**
 * Composer Impression Dimensions
 * 作曲家の作風・特徴を表す6軸の印象評価値 (-10 to +10)
 */
export const ComposerImpressionDimensionsSchema = z.object({
  /** 革新性 (Innovation): 伝統的(-10) <-> 革新的(+10) */
  innovation: DimensionSchema,
  /** 情動性 (Emotionality): 知的(-10) <-> 感情的(+10) */
  emotionality: DimensionSchema,
  /** 民族性 (Nationalism): 国際的(-10) <-> 民族的(+10) */
  nationalism: DimensionSchema,
  /** 規模感 (Scale): 親密(-10) <-> 壮大(+10) */
  scale: DimensionSchema,
  /** 複雑性 (Complexity): 簡潔(-10) <-> 複雑(+10) */
  complexity: DimensionSchema,
  /** 演劇性 (Theatricality): 絶対音楽(-10) <-> 演劇的(+10) */
  theatricality: DimensionSchema,
});

export type ComposerImpressionDimensions = z.infer<typeof ComposerImpressionDimensionsSchema>;

/**
 * Composer Metadata
 * 作曲家のメタデータ (多言語対応)
 */
export const ComposerMetadataSchema = z.object({
  /** 作曲家フルネーム (Full Name, e.g. "Ludwig van Beethoven", "ヨハン・セバスチャン・バッハ") */
  fullName: createMultilingualStringSchema({ max: 100 }),
  /** 表示用名称 (Standard Display, e.g. "L. v. Beethoven", "J.S. バッハ") */
  displayName: createMultilingualStringSchema({ max: 70 }),
  /** 短縮名・呼称 (Short Name/Surname, e.g. "Beethoven", "バッハ") */
  shortName: createMultilingualStringSchema({ max: 50 }),
  /** 時代区分 (Taxonomy準拠) */
  era: MusicalEraSchema.optional(),
  /** 伝記・人物紹介 */
  biography: createMultilingualStringSchema({ max: 5000 }).optional(),

  /**
   * 生年月日
   * ISO8601形式の文字列またはDateオブジェクトを受け入れる
   */
  birthDate: z.coerce.date().nullable().optional(),

  /**
   * 没年月日
   * ISO8601形式の文字列またはDateオブジェクトを受け入れる
   */
  deathDate: z.coerce.date().nullable().optional(),

  /**
   * 国籍コード (ISO 3166-1 alpha-2)
   * e.g. "DE", "IT", "FR"
   */
  nationalityCode: NationalitySchema.optional(),

  /** 代表的な楽器 (Taxonomy準拠) [e.g. "Piano", "Violin"] */
  representativeInstruments: z.array(MusicalInstrumentSchema).max(20).default([]),

  /** 代表的なジャンル (Taxonomy準拠) [e.g. "Symphony", "Opera"] */
  representativeGenres: z.array(MusicalGenreSchema).max(20).default([]),

  /** 活動拠点・地点情報 */
  places: z.array(PlaceSchema).max(20).default([]),

  /** 肖像画・イメージ画像のリソースパス */
  portrait: ResourcePathSchema,

  /** 自由タグ (e.g. "Impressionist", "Nationalist") */
  tags: TagsSchema,

  /** 印象次元 (Impression Dimensions) */
  impressionDimensions: ComposerImpressionDimensionsSchema.optional(),
});

export type ComposerMetadata = z.infer<typeof ComposerMetadataSchema>;
