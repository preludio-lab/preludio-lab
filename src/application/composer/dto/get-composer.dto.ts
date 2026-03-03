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

    /** 肖像画・イメージ画像のリソースパス */
    portrait: z.string().nullable(),

    /** 代表的な楽器 */
    representativeInstruments: z.array(z.string()),

    /** 代表的なジャンル */
    representativeGenres: z.array(z.string()),

    /** 活動拠点 */
    places: z.array(
      z
        .object({
          slug: z.string(),
          type: z.string(),
          countryCode: z.string().optional(),
        })
        .strict(),
    ),

    /** 自由タグ */
    tags: z.array(z.string()),

    /** 印象次元 (-10 to +10) */
    impressionDimensions: z
      .object({
        innovation: z.number(),
        emotionality: z.number(),
        nationalism: z.number(),
        scale: z.number(),
        complexity: z.number(),
        theatricality: z.number(),
      })
      .nullable(),

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

    /** 作成日時 */
    createdAt: z.string(),

    /** 更新日時 (オプティミスティックロック用) */
    updatedAt: z.string(),
  })
  .strict();

export type GetComposerDto = z.infer<typeof GetComposerDtoSchema>;
