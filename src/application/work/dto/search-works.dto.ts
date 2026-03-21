import { z } from 'zod';
import { SlugSchema } from '@/domain/shared/common.metadata';

/**
 * Work Search Request Schema
 * 1万件以上の規模を見据え、limit, offset, sort を必須としています。
 */
export const WorkSearchRequestSchema = z.object({
  /** 言語コード */
  lang: z.string().min(2),
  /** フィルタ条件 */
  filter: z
    .object({
      composerId: z.string().uuid().optional(),
      genre: z.string().optional(),
      era: z.string().optional(),
      keyword: z.string().optional(),
    })
    .optional(),
  /** ソート条件 */
  sort: z.object({
    field: z.enum(['title', 'compositionYear', 'createdAt']),
    direction: z.enum(['asc', 'desc']),
  }),
  /** ページネーション (必須) */
  pagination: z.object({
    limit: z.number().int().min(1).max(100),
    offset: z.number().int().min(0),
  }),
});

export type WorkSearchRequestParams = z.infer<typeof WorkSearchRequestSchema>;

/**
 * Work Search Response Schema (DTO)
 * ドメインスキーマから必要なフィールドのみを抽出し、UI向けの構造を定義します。
 */
export const WorkSearchResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      slug: SlugSchema,
      localizedTitle: z.string(),
      compositionYear: z.number().nullable(),
      composer: z.object({
        slug: SlugSchema,
        name: z.string(),
      }),
    }),
  ),
  totalCount: z.number().int().min(0),
  hasNextPage: z.boolean(),
});

export type WorkSearchResponseDto = z.infer<typeof WorkSearchResponseSchema>;
export type WorkListItemDto = WorkSearchResponseDto['items'][number];
