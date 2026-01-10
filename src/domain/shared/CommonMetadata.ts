import { z, zInt } from '@/shared/validation/zod';
import { MusicalPlaceSchema } from './MusicalPlace';
import { NationalitySchema } from './Nationality';

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
  slug: MusicalPlaceSchema,
  /** 拠点タイプ (生誕地、没地、主な活動地) */
  type: z.enum(['birth', 'death', 'activity', 'other']).default('activity'),
  /** 国コード (ISO 3166-1 alpha-2) */
  countryCode: NationalitySchema.optional(),
});

export type Place = z.infer<typeof PlaceSchema>;

/**
 * 印象評価値の共通スキーマ (-10 to +10)
 */
export const DimensionSchema = zInt().min(-10).max(10);

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
 * スラグのバリデーション用正規表現
 * - 英小文字、数字、ハイフンのみを許可
 * - 先頭と末尾にハイフンやスラッシュは禁止
 */
export const SLUG_FLAT_REGEX = /^[a-z0-9-]+$/;

/**
 * 階層構造（スラッシュ区切り）を許可するスラグの正規表現
 */
export const SLUG_HIERARCHICAL_REGEX = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

/**
 * スラグのバリデーションスキーマを作成する
 * @param maxLength 最大文字数 (デフォルト: 64)
 * @param allowHierarchical スラッシュによる階層構造を許可するか (デフォルト: true)
 */
export const createSlugSchema = (maxLength: number = 64, allowHierarchical: boolean = true) => {
  const regex = allowHierarchical ? SLUG_HIERARCHICAL_REGEX : SLUG_FLAT_REGEX;
  const message = allowHierarchical
    ? 'Slug must be lowercase alphanumeric and hyphens, optionally separated by a single slash'
    : 'Slug must be lowercase alphanumeric and hyphens only';

  return z.string().min(1).max(maxLength).regex(regex, { message });
};

/**
 * デフォルトのスラグスキーマ（最大64文字、階層構造許可）
 */
export const SlugSchema = createSlugSchema(64, true);
