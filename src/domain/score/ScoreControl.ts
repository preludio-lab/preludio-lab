/**
 * Score ID
 * UUID v7
 */
export type ScoreId = string;

/**
 * Score Format Type (Local Definition)
 */
export type ScoreFormatType = 'abc' | 'musicxml';

/**
 * Score Control
 */
export interface ScoreIdHolder {
    readonly id: ScoreId;
}

export interface ScoreControl extends ScoreIdHolder {
    readonly workId: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export const createScoreControl = (
    id: ScoreId,
    workId: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
): ScoreControl => ({
    id,
    workId,
    createdAt,
    updatedAt,
});
