import { ScoreFormatType } from './ScoreFormat';

/**
 * 小節範囲
 */
export interface MeasureRange {
    readonly startBar: number;
    readonly endBar: number;
    readonly label?: string;
}

/**
 * MusicalExampleMetadata
 * 譜例のメタデータ
 */
export interface MusicalExampleMetadata {
    readonly workId: string; // 楽曲ID
    readonly scoreId?: string; // 出典楽譜ID（任意）
    readonly slug: string; // URL等で使用する識別子 (e.g., '1st-theme')
    readonly format: ScoreFormatType;
    readonly data: string; // 楽譜データ本体 (ABC記法など)
    readonly measureRange?: MeasureRange;
    readonly caption?: string;
    readonly description?: string;
}

/**
 * MusicalExampleMetadata の生成
 */
export const createMusicalExampleMetadata = (
    params: Omit<MusicalExampleMetadata, 'caption' | 'description' | 'measureRange' | 'scoreId'> &
        Partial<Pick<MusicalExampleMetadata, 'caption' | 'description' | 'measureRange' | 'scoreId'>>
): MusicalExampleMetadata => ({
    ...params,
    measureRange: params.measureRange ? { ...params.measureRange } : undefined,
});
