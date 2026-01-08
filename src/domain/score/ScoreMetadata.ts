import { z } from 'zod';
import { MultilingualStringSchema } from '../i18n/Locale';
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
 * ScoreMetadata
 * 楽譜エディションのメタデータ。
 * 出版社、校訂者、識別コードなどを管理。
 */
export const ScoreMetadataSchema = z.object({
    /** 出版社名 (i18n対応) */
    publisherName: MultilingualStringSchema.optional(),
    /** 校訂者名 (i18n対応) */
    editorName: MultilingualStringSchema.optional(),
    /** エディション名 (i18n対応, 例: "Urtext", "全音ピアノライブラリー") */
    editionName: MultilingualStringSchema.optional(),
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
