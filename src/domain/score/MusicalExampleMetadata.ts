import { ScoreFormatType } from './Score';

/**
 * Measure Range
 * 譜例の小節範囲を定義します
 */
export interface MeasureRange {
    readonly startBar: number; // 1-indexed
    readonly endBar: number;
    readonly label?: string; // e.g., "bars 1-8"
}

/**
 * MusicalExample Metadata
 */
export interface MusicalExampleMetadata {
    readonly workId: string; // Reference to Work
    readonly scoreId?: string; // Optional Reference to Score Edition (Asset)
    readonly slug: string; // e.g., "1st-theme"
    readonly format: ScoreFormatType;
    readonly data: string; // The notation data (ABC string, etc.)
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
