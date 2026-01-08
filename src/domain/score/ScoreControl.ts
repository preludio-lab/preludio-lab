/**
 * ScoreId (UUID v7)
 */
export type ScoreId = string;

/**
 * ScoreControl
 * 楽譜エディションの制御情報。
 * IDとライフサイクル情報を管理。
 */
export interface ScoreControl {
    readonly id: ScoreId;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

/**
 * ScoreControl の生成
 */
export const createScoreControl = (
    id: ScoreId,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
): ScoreControl => ({
    id,
    createdAt,
    updatedAt,
});
