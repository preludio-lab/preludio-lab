/**
 * 楽譜フォーマットの定数定義
 */
export const ScoreFormat = {
    ABC: 'abc',
    MUSICXML: 'musicxml',
} as const;

/**
 * 楽譜フォーマットの型定義
 */
export type ScoreFormatType = (typeof ScoreFormat)[keyof typeof ScoreFormat];
