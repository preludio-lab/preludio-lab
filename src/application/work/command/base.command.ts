import { z } from 'zod';
import { WorkMetadataBaseSchema } from '@/domain/work/work.metadata';
import { MusicalIdentitySchema } from '@/domain/work/work.shared';
import { WorkPartDataSchema } from '@/domain/work/work-part.schema';

/**
 * Work Base Command Schema
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
