import { InferSelectModel } from 'drizzle-orm';
import { composers, composerTranslations } from '@/infrastructure/database/schema';

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
  findById(id: string): Promise<ComposerRows | null>;

  /**
   * Find composer and its translations by Slug
   */
  findBySlug(slug: string): Promise<ComposerRows | null>;

  /**
   * Upsert composer and its translations (Atomic Transaction)
   */
  save(rows: ComposerRows): Promise<void>;

  /**
   * Delete composer by ID
   */
  delete(id: string): Promise<void>;
}
