import { z } from 'zod';

/**
 * ページネーション対応レスポンス
 * ページネーション対応の共通レスポンス
 */
export const PagedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        totalCount: z.number().int().nonnegative(),
        hasNextPage: z.boolean(),
        nextCursor: z.string().optional(),
    });

export type PagedResponse<T> = {
    items: T[];
    totalCount: number;
    hasNextPage: boolean;
    nextCursor?: string;
};
