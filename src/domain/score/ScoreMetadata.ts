/**
 * アフィリエイトリンク
 */
export interface AffiliateLink {
    readonly provider: string; // 例: "amazon", "sheetmusicplus"
    readonly url: string;
    readonly label?: string;
}

/**
 * 楽譜メタデータ
 * 楽譜エディションのメタデータ
 */
export interface ScoreMetadata {
    readonly publisherName?: string;
    readonly editorName?: string;
    readonly editionName?: string;
    readonly isbn?: string;
    readonly janCode?: string;
    readonly affiliateLinks: readonly AffiliateLink[];
    readonly pdfUrl?: string;
}

export const createScoreMetadata = (params: Partial<ScoreMetadata>): ScoreMetadata => ({
    publisherName: params.publisherName,
    editorName: params.editorName,
    editionName: params.editionName,
    isbn: params.isbn,
    janCode: params.janCode,
    affiliateLinks: params.affiliateLinks ?? [],
    pdfUrl: params.pdfUrl,
});
