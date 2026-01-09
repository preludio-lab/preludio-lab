import { z } from 'zod';
import { zInt } from '@/shared/validation/zod';

/**
 * ページネーション対応レスポンス
 */
export const PagedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    totalCount: zInt().nonnegative(),
    hasNextPage: z.boolean(),
    nextCursor: z.string().optional(),
  });

export type PagedResponse<T> = {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
  nextCursor?: string;
};
