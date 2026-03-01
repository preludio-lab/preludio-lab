import { z } from 'zod';

/**
 * Get Composer Response DTO
 * アプリケーション外部へ返す作曲家データ（単一リソース用）の構造定義。
 * ドメインの MasterSchema をベースにしつつ、関連作品などのUI要件を結合します。
 */
export const GetComposerDtoSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    biography: z.string().nullable(),
    era: z.string().nullable(),
    birthDate: z.string().nullable(),
    deathDate: z.string().nullable(),
    nationalityCode: z.string().nullable(),

    // 多言語データ
    translations: z.record(
      z.string(),
      z
        .object({
          fullName: z.string(),
          displayName: z.string(),
          shortName: z.string(),
          biography: z.string().nullable(),
        })
        .strict(),
    ),

    // 関連作品プレビュー
    relatedWorks: z.array(
      z
        .object({
          id: z.string(),
          title: z.string(),
          year: z.number().nullable(),
        })
        .strict(),
    ),

    // オプティミスティックロック用
    updatedAt: z.string(),
  })
  .strict();

export type GetComposerDto = z.infer<typeof GetComposerDtoSchema>;
