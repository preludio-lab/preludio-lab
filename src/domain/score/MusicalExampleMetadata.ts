import { ScoreFormatType } from './Score';

/**
 * 小節範囲
 * 譜例の小節範囲を定義します
 */
export interface MeasureRange {
    readonly startBar: number; // 1から始まる開始小節
    readonly endBar: number;
    readonly label?: string; // 例: "bars 1-8"
}

/**
 * 譜例メタデータ
 */
export interface MusicalExampleMetadata {
    readonly workId: string; // 作品への参照
    readonly scoreId?: string; // 楽譜エディション(資産)へのオプション参照
    readonly slug: string; // 例: "1st-theme"
    readonly format: ScoreFormatType;
    readonly data: string; // 楽譜データ (ABC形式の文字列など)
    readonly measureRange?: MeasureRange;
    readonly caption?: string;
    readonly description?: string;
}

export const createMusicalExampleMetadata = (params: {
    workId: string;
    slug: string;
    format: ScoreFormatType;
    data: string;
} & Partial<MusicalExampleMetadata>): MusicalExampleMetadata => ({
    workId: params.workId,
    scoreId: params.scoreId,
    slug: params.slug,
    format: params.format,
    data: params.data,
    measureRange: params.measureRange,
    caption: params.caption,
    description: params.description,
});
