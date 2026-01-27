import { z } from 'zod';
import { WorkDataSchema } from '@/domain/work/work.schema';

/**
 * Work DTO
 */
export const WorkDtoSchema = WorkDataSchema;

export type WorkDto = z.infer<typeof WorkDtoSchema>;
