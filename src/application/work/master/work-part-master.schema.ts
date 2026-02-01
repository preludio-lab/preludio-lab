import { z } from 'zod';
import { WorkPartControlSchema } from '@/domain/work/work-part.control';
import { WorkPartMetadataBaseSchema } from '@/domain/work/work-part.metadata';
import { MusicalIdentitySchema } from '@/domain/work/work.shared';

/**
 * Work Part Master Data Schema (Nested JSON Item)
 * 楽曲マスタデータ(JSON)内で、parts配列の各要素として使用されるスキーマ。
 */
export const WorkPartMasterSchema = WorkPartControlSchema.pick({
  slug: true,
  order: true,
})
  .merge(
    WorkPartMetadataBaseSchema.pick({
      titleComponents: true,
      catalogues: true,
      type: true,
      isNameStandard: true,
      description: true,
      performanceDifficulty: true,
      impressionDimensions: true,
      nicknames: true,
      tags: true,
      basedOn: true,
    }),
  )
  .merge(
    MusicalIdentitySchema.pick({
      genres: true,
      key: true,
      tempo: true,
      tempoTranslation: true,
      timeSignature: true,
      bpm: true,
      metronomeUnit: true,
    }),
  )
  .superRefine((data, ctx) => {
    // isPrimary: true が複数存在しないことを確認
    const primaryCount = data.catalogues.filter((c) => c.isPrimary).length;
    if (primaryCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Primary catalogue must be at most one.',
        path: ['catalogues'],
      });
    }
  });

export type WorkPartMaster = z.infer<typeof WorkPartMasterSchema>;
