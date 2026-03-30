import { z } from '@/shared/validation/zod';
import { AppLocale } from '@/domain/i18n/locale';

/**
 * 7言語対応のラベルスキーマ
 */
export const TaxonomyLabelSchema = z.union([
  z.record(z.nativeEnum(AppLocale), z.string()),
  z.string(),
]);

export type TaxonomyLabel = z.infer<typeof TaxonomyLabelSchema>;

/**
 * 7言語対応の解説文スキーマ
 */
export const TaxonomyDescriptionSchema = z.object({
  ja: z.string(),
  en: z.string(),
  de: z.string().optional(),
  fr: z.string().optional(),
  it: z.string().optional(),
  es: z.string().optional(),
  zh: z.string().optional(),
});

export type TaxonomyDescription = z.infer<typeof TaxonomyDescriptionSchema>;

/**
 * タクソノミーアイテムの基本構造
 */
export const TaxonomyItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  label: TaxonomyLabelSchema,
  description: TaxonomyDescriptionSchema.optional(),
  examples: z.array(z.string()).optional(),
});

export type TaxonomyItem = z.infer<typeof TaxonomyItemSchema>;

/**
 * カテゴリ構造（ジャンル、楽器等）
 */
export const TaxonomyCategorySchema = z.object({
  category: z.string().optional(),
  label: TaxonomyLabelSchema.optional(),
  items: z.array(TaxonomyItemSchema),
});

export type TaxonomyCategory = z.infer<typeof TaxonomyCategorySchema>;

/**
 * タクソノミーファイルのトップレベル構造
 */
export const TaxonomyFileSchema = z.record(
  z.string(),
  z.union([z.array(TaxonomyItemSchema), z.array(TaxonomyCategorySchema)]),
);

export type TaxonomyFile = z.infer<typeof TaxonomyFileSchema>;
