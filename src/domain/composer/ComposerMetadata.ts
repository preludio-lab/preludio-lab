import { z } from '@/shared/validation/zod';
import { createMultilingualStringSchema } from '../i18n/Locale';
import { MusicalEraSchema } from '../shared/MusicalEra';
import { ResourcePathSchema, TagsSchema, PlaceSchema, ComposerImpressionDimensionsSchema } from '../shared/CommonMetadata';
import { NationalitySchema } from '../shared/Nationality';
import { MusicalInstrumentSchema } from '../shared/MusicalInstrument';
import { MusicalGenreSchema } from '../work/MusicalGenre';

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
