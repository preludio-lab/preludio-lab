import { WorkMetadataBaseSchema } from '@/domain/work/work.metadata';
import { MusicalIdentitySchema } from '@/domain/work/work.shared';

/**
 * Work Base Command Schema
 *
 * 作品(Work)の作成・更新に共通する基本フィールド定義です。
 * ドメイン層の `WorkMetadataBaseSchema` と `MusicalIdentitySchema` から
 * 必要なフィールドをピックアップして構成しています。
 */
export const WorkBaseCommandSchema = WorkMetadataBaseSchema.pick({
  titleComponents: true,
  catalogues: true,
  era: true,
  compositionYear: true,
  compositionPeriod: true,
  impressionDimensions: true,
  nicknames: true,
  tags: true,
  instrumentation: true,
  instrumentationFlags: true,
  performanceDifficulty: true,
  description: true,
  basedOn: true,
}).merge(
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
