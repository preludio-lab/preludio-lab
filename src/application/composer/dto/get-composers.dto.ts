import { z } from 'zod';

/**
 * Get Composers Response DTO
 * アプリケーション外部へ返す作曲家データ（リスト用）の構造定義。
 */
export const GetComposersDtoSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    era: z.string().nullable(),
    worksCount: z.number(),
  })
  .strict();

export type GetComposersDto = z.infer<typeof GetComposersDtoSchema>;
