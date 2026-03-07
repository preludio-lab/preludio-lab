import { InferSelectModel } from 'drizzle-orm';
import { composers, composerTranslations } from '@/infrastructure/database/schema';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

export type ComposerRow = InferSelectModel<typeof composers>;
export type ComposerTranslationRow = InferSelectModel<typeof composerTranslations>;

export interface ComposerRows {
  composer: ComposerRow;
  translations: ComposerTranslationRow[];
}

export interface IComposerDataSource {
  /**
   * Find composer and its translations by ID
   */
  findById(id: string, ctx?: TransactionContext): Promise<ComposerRows | null>;

  /**
   * Find composer and its translations by Slug
   */
  findBySlug(slug: string, ctx?: TransactionContext): Promise<ComposerRows | null>;

  /**
   * Find composers and their translations by Slugs
   */
  findBySlugs(slugs: string[], ctx?: TransactionContext): Promise<ComposerRows[]>;

  /**
   * Upsert composer and its translations (Atomic Transaction)
   */
  save(rows: ComposerRows, ctx?: TransactionContext): Promise<void>;

  /**
   * Upsert multiple composers and their translations
   */
  saveMany(rowsList: ComposerRows[], ctx?: TransactionContext): Promise<void>;

  /**
   * Find many composers
   */
  findMany(
    params?: { limit?: number; offset?: number },
    ctx?: TransactionContext,
  ): Promise<ComposerRows[]>;

  /**
   * Delete composer by ID
   */
  deleteById(id: string, ctx?: TransactionContext): Promise<void>;

  /**
   * Delete composers by Slugs
   */
  deleteBySlugs(slugs: string[], ctx?: TransactionContext): Promise<void>;
}
