import { z } from 'zod';
import { AppLocale } from './Locale';

/**
 * Multilingual String
 * 多言語対応の文字列コンテナ。
 * AppLocale で定義された各言語コードをキーに持ちます。
 */
export const MultilingualStringSchema = z.object({
    [AppLocale.EN]: z.string().optional(),
    [AppLocale.JA]: z.string().optional(),
    [AppLocale.ES]: z.string().optional(),
    [AppLocale.DE]: z.string().optional(),
    [AppLocale.FR]: z.string().optional(),
    [AppLocale.IT]: z.string().optional(),
    [AppLocale.ZH]: z.string().optional(),
});

export type MultilingualString = z.infer<typeof MultilingualStringSchema>;
