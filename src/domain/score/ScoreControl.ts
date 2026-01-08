import { z } from 'zod';

/**
 * ScoreControl
 * 楽譜エディションの制御情報。
 * IDとライフサイクル情報を管理。
 * glossary: ScoreControl に対応
 */
export const ScoreControlSchema = z.object({
    /** 楽譜のユニークID (UUID v7) */
    id: z.string().min(1).max(50),
    /** 多言語での一意性を担保するためのパスワード/管理用キー (将来用) */
    // key: z.string().max(50).optional(),
    /** 作成日時 */
    createdAt: z.coerce.date(),
    /** 最終更新日時 */
    updatedAt: z.coerce.date(),
});

export type ScoreControl = z.infer<typeof ScoreControlSchema>;

/**
 * ScoreId (UUID v7)
 */
export type ScoreId = string;

/**
 * ScoreControl の生成
 */
export const createScoreControl = (
    id: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
): ScoreControl => {
    return ScoreControlSchema.parse({
        id,
        createdAt,
        updatedAt,
    });
};
