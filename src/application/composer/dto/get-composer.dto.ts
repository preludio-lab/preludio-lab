import { z } from 'zod';
import { ComposerControlSchema } from '@/domain/composer/composer.control';
import { ComposerMetadataSchema } from '@/domain/composer/composer.metadata';

/**
 * Get Composer Response DTO
 * アプリケーション外部へ返す作曲家データ（単一リソース用）の構造定義。
 * ドメインの MasterSchema をベースにしつつ、関連作品などのUI要件を結合（Composition）します。
 */

const baseControl = ComposerControlSchema.pick({
  id: true,
  slug: true,
}).extend({
  createdAt: ComposerControlSchema.shape.createdAt.transform((d) => d.toISOString()),
  updatedAt: ComposerControlSchema.shape.updatedAt.transform((d) => d.toISOString()),
});

const baseMetadata = ComposerMetadataSchema.pick({
  representativeInstruments: true,
  representativeGenres: true,
  places: true,
  tags: true,
  impressionDimensions: true,
}).extend({
  name: z.string(),
  biography: z.string().nullable(),
  era: ComposerMetadataSchema.shape.era.nullable(),
  // DTO層での直列化の契約 (Date -> ISO String)
  birthDate: z.coerce
    .date()
    .nullable()
    .transform((d) => (d ? d.toISOString() : null)),
  deathDate: z.coerce
    .date()
    .nullable()
    .transform((d) => (d ? d.toISOString() : null)),
  nationalityCode: ComposerMetadataSchema.shape.nationalityCode.nullable(),
  portrait: ComposerMetadataSchema.shape.portrait.nullable(),
});

export const GetComposerDtoSchema = baseControl
  .merge(baseMetadata)
  .extend({
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
    // 関連作品プレビュー (Composition from Work domain)
    relatedWorks: z.array(
      z
        .object({
          id: z.string(),
          title: z.string(),
          year: z.number().nullable(),
        })
        .strict(),
    ),
  })
  .strict();

export type GetComposerDto = z.infer<typeof GetComposerDtoSchema>;
