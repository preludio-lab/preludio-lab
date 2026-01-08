import { z } from 'zod';
import { AppLocale, MultilingualStringSchema } from '../i18n/Locale';
import { AffiliateLinkSchema } from '../monetization/Monetization';

/**
 * 楽譜フォーマットの定数定義
 */
export const ScoreFormat = {
    ABC: 'abc',
    MUSICXML: 'musicxml',
} as const;

/**
 * 楽譜フォーマットの Zod スキーマ
 */
export const ScoreFormatSchema = z.nativeEnum(ScoreFormat);

/**
 * 楽譜フォーマットの型定義
 */
export type ScoreFormatType = z.infer<typeof ScoreFormatSchema>;

/**
 * 名称用多言語文字列スキーマ (最大20文字)
 */
const NameMultilingualSchema = z.object({
    [AppLocale.EN]: z.string().max(20).optional(),
    [AppLocale.JA]: z.string().max(20).optional(),
    [AppLocale.ES]: z.string().max(20).optional(),
    [AppLocale.DE]: z.string().max(20).optional(),
    [AppLocale.FR]: z.string().max(20).optional(),
    [AppLocale.IT]: z.string().max(20).optional(),
    [AppLocale.ZH]: z.string().max(20).optional(),
});

/**
 * ScoreMetadata
 * 楽譜エディションのメタデータ。
 * 出版社、校訂者、識別コードなどを管理。
 */
export const ScoreMetadataSchema = z.object({
    /** 出版社 (組織または個人) */
    publisher: NameMultilingualSchema.optional(),
    /** 校訂者・監修者 (個人または監修団体) */
    editor: NameMultilingualSchema.optional(),
    /** エディション名 (例: "Urtext", "全音ピアノライブラリー") */
    edition: NameMultilingualSchema.optional(),
    /** ISBNコード */
    isbn: z.string().max(20).optional(),
    /** GTINコード (JAN/EAN/UPC等の国際標準商品識別コード) */
    gtin: z.string().max(20).optional(),
    /** アフィリエイトリンクのリスト (最大20件) */
    affiliateLinks: z.array(AffiliateLinkSchema).max(20).default([]),
    /** プレビュー用PDF URL */
    pdfUrl: z.string().url().max(2048).optional(),
    /** 楽譜全体の主要フォーマット (混合の場合は省略可) */
    format: ScoreFormatSchema.optional(),
});

export type ScoreMetadata = z.infer<typeof ScoreMetadataSchema>;
