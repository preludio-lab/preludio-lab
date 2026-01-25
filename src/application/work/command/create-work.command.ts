import { z } from 'zod';
import { WorkBaseCommandSchema } from './base.command';
import { WorkPartDataSchema } from '@/domain/work/work-part.schema';

/**
 * Create Work Command
 */
export const CreateWorkCommandSchema = WorkBaseCommandSchema.extend({
  slug: z.string().min(1),
  composerSlug: z.string().min(1),
  parts: z.array(WorkPartDataSchema).default([]),
});

export type CreateWorkCommand = z.infer<typeof CreateWorkCommandSchema>;
