import { z } from 'zod';

/**
 * 楽譜フォーマットの定数定義
 */
export const ScoreFormat = {
    ABC: 'abc',
    MUSICXML: 'musicxml',
} as const;

/**
 * 楽譜フォーマットの Zod スキーマ
 */
export const ScoreFormatSchema = z.nativeEnum(ScoreFormat);

/**
 * 楽譜フォーマットの型定義
 */
export type ScoreFormatType = z.infer<typeof ScoreFormatSchema>;
