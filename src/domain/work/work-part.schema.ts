import { z } from 'zod';
import { WorkPartControlSchema } from './work-part.control';
import { WorkPartMetadataSchema } from './work-part.metadata';
import { MusicalIdentitySchema } from './work.shared';

/**
 * Work Part Data Schema (Nested JSON Item)
 * 楽曲マスタデータ(JSON)内で、parts配列の各要素として使用されるスキーマ。
 *
 * - Control: Slug, ID (Optional for input, but internally managed)
 * - Metadata: Title, Type, Attributes
 *
 * 親(Work)と同様に、ControlとMetadataから必要なフィールドをPickして構成します。
 */
export const WorkPartDataSchema = WorkPartControlSchema.pick({
  slug: true,
  order: true,
})
  .merge(
    WorkPartMetadataSchema.pick({
      titleComponents: true,
      type: true,
      isNameStandard: true,
      description: true,
      performanceDifficulty: true,
      impressionDimensions: true,
      nicknames: true,
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
  );

export type WorkPartData = z.infer<typeof WorkPartDataSchema>;
