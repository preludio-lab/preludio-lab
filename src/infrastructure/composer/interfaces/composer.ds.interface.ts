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
   * Upsert composer and its translations (Atomic Transaction)
   */
  save(rows: ComposerRows, ctx?: TransactionContext): Promise<void>;

  /**
   * Delete composer by ID
   */
  deleteById(id: string, ctx?: TransactionContext): Promise<void>;
}
