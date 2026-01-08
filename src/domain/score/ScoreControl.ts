/**
 * 楽譜ID
 * UUID v7
 */
export type ScoreId = string;

/**
 * 楽譜フォーマット型 (ローカル定義)
 */
export type ScoreFormatType = 'abc' | 'musicxml';

/**
 * 楽譜IDホルダー
 */
export interface ScoreIdHolder {
    readonly id: ScoreId;
}

/**
 * 楽譜コントロール
 * 管理用・ライフサイクル情報
 */
export interface ScoreControl extends ScoreIdHolder {
    readonly workId: string; // 作品IDへの外部キー
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
