import { z } from 'zod';
import { ScoreFormatSchema } from './ScoreFormat';

/**
 * アフィリエイトリンクの Zod スキーマ
 */
export const AffiliateLinkSchema = z.object({
    /** 提供者名 (amazon, henle等) */
    provider: z.string().min(1).max(50),
    /** URL */
    url: z.string().url().max(2048),
    /** ボタン等に表示するラベル */
    label: z.string().max(20).optional(),
});

export type AffiliateLink = z.infer<typeof AffiliateLinkSchema>;

/**
 * ScoreMetadata
 * 楽譜エディションのメタデータ。
 * 出版社、校訂者、識別コードなどを管理。
 */
export const ScoreMetadataSchema = z.object({
    /** 出版社名 */
    publisherName: z.string().max(50).optional(),
    /** 校訂者名 */
    editorName: z.string().max(50).optional(),
    /** エディション名 */
    editionName: z.string().max(50).optional(),
    /** ISBNコード */
    isbn: z.string().max(20).optional(),
    /** JANコード */
    janCode: z.string().max(20).optional(),
    /** アフィリエイトリンクのリスト (最大20件) */
    affiliateLinks: z.array(AffiliateLinkSchema).max(20).default([]),
    /** プレビュー用PDF URL */
    pdfUrl: z.string().url().max(2048).optional(),
    /** 楽譜全体の主要フォーマット (混合の場合は省略可) */
    format: ScoreFormatSchema.optional(),
});

export type ScoreMetadata = z.infer<typeof ScoreMetadataSchema>;

/**
 * ScoreMetadata の生成
 */
export const createScoreMetadata = (params: Partial<ScoreMetadata>): ScoreMetadata => {
    return ScoreMetadataSchema.parse(params);
};
