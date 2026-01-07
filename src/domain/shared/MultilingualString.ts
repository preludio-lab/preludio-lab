import { z } from 'zod';

/**
 * Multilingual String
 * 多言語対応の文字列コンテナ。
 * DBスキーマ: `MultilingualString` に対応
 */
export const MultilingualStringSchema = z.object({
    en: z.string().optional(),
    ja: z.string().optional(),
    fr: z.string().optional(),
    de: z.string().optional(),
    it: z.string().optional(),
    es: z.string().optional(),
    zh: z.string().optional(),
});

export type MultilingualString = z.infer<typeof MultilingualStringSchema>;
