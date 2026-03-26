import { InferSelectModel } from 'drizzle-orm';
import * as schema from '@/infrastructure/database/schema';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

// Row Types
export type WorkRow = InferSelectModel<typeof schema.works>;
export type WorkTranslationRow = InferSelectModel<typeof schema.workTranslations>;
export type WorkPartRow = InferSelectModel<typeof schema.workParts>;
export type WorkPartTranslationRow = InferSelectModel<typeof schema.workPartTranslations>;

// Aggregated Row Structure for Work
export interface WorkPartRows {
  part: WorkPartRow;
  translations: WorkPartTranslationRow[];
}

export interface WorkRows {
  work: WorkRow;
  translations: WorkTranslationRow[];
  // Optional to allow saving Work Core without affecting parts
  parts?: WorkPartRows[];
  // Include Composer info for Domain hydration (slug)
  composer?: {
    slug: string;
  };
}

export interface IWorkDataSource {
  /**
   * Find work by ID
   */
  findById(id: string, ctx?: TransactionContext): Promise<WorkRows | null>;

  /**
   * Find work by Slug
   */
  findBySlug(composerId: string, slug: string, ctx?: TransactionContext): Promise<WorkRows | null>;

  /**
   * Upsert Work Chain (Atomic Transaction)
   */
  save(rows: WorkRows, ctx?: TransactionContext): Promise<void>;
  // ... (rest of interface unchanged)

  /**
   * Delete Work
   */
  deleteById(id: string, ctx?: TransactionContext): Promise<void>;

  // --- Part Operations ---

  /**
   * Upsert a single Work Part
   */
  savePart(rows: WorkPartRows, ctx?: TransactionContext): Promise<void>;

  /**
   * Upsert multiple Work Parts
   */
  saveParts(rows: WorkPartRows[], ctx?: TransactionContext): Promise<void>;

  /**
   * Delete all parts for a work
   */
  deletePartsByWorkId(workId: string, ctx?: TransactionContext): Promise<void>;

  /**
   * Find a single Work Part by ID
   */
  findPartById(partId: string, ctx?: TransactionContext): Promise<WorkPartRows | null>;

  /**
   * Delete a single Work Part by ID
   */
  deletePartById(partId: string, ctx?: TransactionContext): Promise<void>;
}
