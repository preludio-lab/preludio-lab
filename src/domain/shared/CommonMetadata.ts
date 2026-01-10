import { z, zInt } from '@/shared/validation/zod';
import { SlugSchema } from './Slug';

/**
 * 共有のメタデータスキーマ定義 (CommonMetadata)
 * 全ドメイン共通で使用される汎用的な Value Objects を定義します。
 */

/** URLやパス hostの最大長 */
export const MAX_URL_LENGTH = 2_048;

/**
 * URLのみを許容するスキーマ (絶対URL)
 */
export const UrlSchema = z.string().url().max(MAX_URL_LENGTH);

/**
 * リソースパスのスキーマ (内部パスまたは外部URL)
 */
export const ResourcePathSchema = z.string().max(MAX_URL_LENGTH).optional().or(z.literal(''));

/**
 * タグリストのスキーマ
 */
export const TagsSchema = z.array(z.string().max(50)).max(100).default([]);

/**
 * 西暦のスキーマ
 */
export const YearSchema = zInt().min(1000).max(2999);

/**
 * 活動拠点 (地点データ)
 */
export const PlaceSchema = z.object({
    /** 地点スラグ (e.g. "vienna", "paris") - 多言語表現はUI層でメッセージ定義から取得 */
    slug: SlugSchema,
    /** 拠点タイプ (生誕地、没地、主な活動地) */
    type: z.enum(['birth', 'death', 'activity', 'other']).default('activity'),
    /** 国コード (ISO 3166-1 alpha-2) */
    countryCode: z.string().length(2).optional(),
});

export type Place = z.infer<typeof PlaceSchema>;
