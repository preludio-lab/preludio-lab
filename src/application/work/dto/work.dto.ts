import { z } from 'zod';
import { WorkMasterSchema } from '../master/work-master.schema';

/**
 * Work DTO
 */
export const WorkDtoSchema = WorkMasterSchema;

export type WorkDto = z.infer<typeof WorkDtoSchema>;
