import { ScoreFormatType } from './ScoreFormat';

/**
 * アフィリエイトリンク情報
 */
export interface AffiliateLink {
    readonly provider: string; // e.g., 'amazon', 'henle'
    readonly url: string;
    readonly label?: string;
}

/**
 * ScoreMetadata
 * 楽譜エディションのメタデータ。
 * 出版社、校訂者、識別コードなどを管理。
 */
export interface ScoreMetadata {
    readonly publisherName?: string;
    readonly editorName?: string;
    readonly editionName?: string;
    readonly isbn?: string;
    readonly janCode?: string;
    readonly affiliateLinks: readonly AffiliateLink[];
    readonly pdfUrl?: string;
    readonly format?: ScoreFormatType; // 楽譜全体の形式（混合の場合は省略可）
}

export const createScoreMetadata = (params: Partial<ScoreMetadata>): ScoreMetadata => ({
    publisherName: params.publisherName,
    editorName: params.editorName,
    editionName: params.editionName,
    isbn: params.isbn,
    janCode: params.janCode,
    affiliateLinks: params.affiliateLinks ? [...params.affiliateLinks] : [],
    pdfUrl: params.pdfUrl,
    format: params.format,
});
