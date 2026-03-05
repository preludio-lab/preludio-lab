import { z } from 'zod';
import { ComposerControlSchema } from '@/domain/composer/composer.control';
import { ComposerMetadataSchema } from '@/domain/composer/composer.metadata';

/**
 * Get Composers Response DTO
 * アプリケーション外部へ返す作曲家データ（リスト用）の構造定義。
 */
export const LocalizedComposerDtoSchema = ComposerControlSchema.pick({
  id: true,
  slug: true,
})
  .extend({
    name: z.string(),
    era: ComposerMetadataSchema.shape.era.nullable(),
    worksCount: z.number(),
    nationalityCode: ComposerMetadataSchema.shape.nationalityCode,
    portrait: ComposerMetadataSchema.shape.portrait.nullable().optional(),
    updatedAt: ComposerControlSchema.shape.updatedAt.transform((d) => d.toISOString()),
  })
  .strict();

export type LocalizedComposerDto = z.output<typeof LocalizedComposerDtoSchema>;
export type LocalizedComposerDtoInput = z.input<typeof LocalizedComposerDtoSchema>;
