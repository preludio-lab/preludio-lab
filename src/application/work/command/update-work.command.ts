import { z } from 'zod';
import { WorkBaseCommandSchema } from './base.command';
import { WorkPartDataSchema } from '@/domain/work/work-part.schema';

/**
 * Update Work Command
 */
export const UpdateWorkCommandSchema = WorkBaseCommandSchema.partial().extend({
  slug: z.string().min(1),
  composerSlug: z.string().min(1),
  parts: z.array(WorkPartDataSchema).optional(),
});

export type UpdateWorkCommand = z.infer<typeof UpdateWorkCommandSchema>;
