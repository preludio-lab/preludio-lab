import { z, zInt } from '@/shared/validation/zod';
import { createMultilingualStringSchema, MultilingualStringSchema } from '../i18n/Locale';
import { SlugSchema } from '../shared/Slug';

/**
 * Musical Property Schemas (Value Objects)
 * 作品全体と個別の楽章（Part）の両方で共有される項目を定義。
 */

/** 調性 (e.g. "c-major", "a-minor") */
export const KeySchema = z.string().max(20);

/** テンポ表示 (e.g. "Allegro con brio", "Quarter note = 120") */
export const TempoSchema = z.string().max(50);

/** 
 * 拍子 (Structured)
 * 4/4 拍子の場合: { numerator: 4, denominator: 4 }
 */
export const TimeSignatureSchema = z.object({
  /** 分子 (Number of beats) */
  numerator: zInt().min(1).max(64),
  /** 分母 (Beat unit) */
  denominator: zInt().min(1).max(64),
});

/** 多言語文字列の制約定義 */
const TitleSchema = createMultilingualStringSchema({ max: 30 });
const DescriptionSchema = createMultilingualStringSchema({ max: 200 });
const TempoTranslationSchema = createMultilingualStringSchema({ max: 50 });
const CompositionPeriodSchema = createMultilingualStringSchema({ max: 20 });

/**
 * Work Part
 * 楽章や組曲の一部などを表す構造
 */
export const WorkPartSchema = z.object({
  /** パーツID (UUID等) */
  id: z.string().uuid(),
  /** URLスラグ (作品内で一意) e.g. "1st-mov" */
  slug: SlugSchema,
  /** 表示順 */
  order: zInt().nonnegative(),
  /** 楽章名・パーツタイトル */
  title: TitleSchema,
  /** 補足説明 */
  description: DescriptionSchema.optional(),

  // --- Musical Identity ---
  /** 調性 */
  key: KeySchema.optional(),
  /** テンポ (原語表記 e.g. "Allegro") */
  tempo: TempoSchema.optional(),
  /** テンポ（多言語訳・補足） */
  tempoTranslation: TempoTranslationSchema.optional(),
  /** 拍子 */
  timeSignature: TimeSignatureSchema.optional(),
});

export type WorkPart = z.infer<typeof WorkPartSchema>;

/**
 * Work Metadata
 * 作品のメタデータ (多言語対応)
 */
export const WorkMetadataSchema = z.object({
  /** 正式名称 */
  title: TitleSchema,
  /** 通称 (e.g. "運命") */
  popularTitle: TitleSchema.optional(),
  /** 作品番号接頭辞 (e.g. "Op.", "BWV") */
  cataloguePrefix: z.string().max(10).optional(),
  /** 作品番号 (e.g. 67, 1001) */
  catalogueNumber: zInt().min(1).max(10000).optional(),
  /** ジャンル (Taxonomy準拠) */
  genre: z.string().max(20).optional(),
  /** 時代区分 (Taxonomy準拠) */
  era: z.string().max(20).optional(),
  /** 楽器編成 (Taxonomy準拠) */
  instrumentation: z.string().max(50).optional(),

  // --- Musical Identity (Typical Values) ---
  /** 調性 */
  key: KeySchema.optional(),
  /** テンポ (原語表記) */
  tempo: TempoSchema.optional(),
  /** テンポ（多言語訳・補足） */
  tempoTranslation: TempoTranslationSchema.optional(),
  /** 拍子 */
  timeSignature: TimeSignatureSchema.optional(),

  /** 作曲年 (ソート用) */
  compositionYear: zInt().min(1000).max(2999).optional(),
  /** 作曲時期 (e.g. "1805年頃") */
  compositionPeriod: CompositionPeriodSchema.optional(),
  /** 検索用別名リスト */
  nicknames: z.array(z.string().max(30)).max(10).default([]),
  /** 作品解説 */
  description: DescriptionSchema.optional(),
  /** 自由タグ */
  tags: z.array(z.string().max(20)).max(50).default([]),
  /** 構成楽曲・楽章リスト */
  parts: z.array(WorkPartSchema).default([]),
});

export type WorkMetadata = z.infer<typeof WorkMetadataSchema>;
