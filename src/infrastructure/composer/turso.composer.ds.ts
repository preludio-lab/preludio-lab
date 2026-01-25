import { eq } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import { IComposerDataSource, ComposerRows } from './interfaces/composer.ds.interface';

export class TursoComposerDataSource implements IComposerDataSource {
  constructor(private db: LibSQLDatabase<typeof schema>) {}

  async findById(id: string): Promise<ComposerRows | null> {
    const result = await this.db.query.composers.findFirst({
      where: eq(schema.composers.id, id),
      with: {
        translations: true,
      },
    });

    if (!result) return null;

    // Destructure translations from result to match ComposerRows interface
    // result is ComposerRow & { translations: ComposerTranslationRow[] }
    const { translations, ...composer } = result;

    return {
      composer,
      translations,
    };
  }

  async findBySlug(slug: string): Promise<ComposerRows | null> {
    const result = await this.db.query.composers.findFirst({
      where: eq(schema.composers.slug, slug),
      with: {
        translations: true,
      },
    });

    if (!result) return null;

    const { translations, ...composer } = result;
    return {
      composer,
      translations,
    };
  }

  async save(rows: ComposerRows): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 1. Upsert Composer Root
      await tx.insert(schema.composers).values(rows.composer).onConflictDoUpdate({
        target: schema.composers.id,
        set: rows.composer,
      });

      // 2. Refresh Translations (Delete & Insert strategy for simplicity in Master Data Sync)
      // Since we want full synchronization with the JSON master, deleting old translations
      // ensures no stale languages remain if they were removed from JSON.

      // However, we must be careful if we have logic that depends on Translation IDs.
      // But ComposerTranslations ID is UUID v7 usually generated or just random.
      // Ideally we should Upsert per language. But "Delete All for Composer" is safer to clean up stale data.

      await tx
        .delete(schema.composerTranslations)
        .where(eq(schema.composerTranslations.composerId, rows.composer.id));

      if (rows.translations.length > 0) {
        await tx.insert(schema.composerTranslations).values(rows.translations);
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schema.composers).where(eq(schema.composers.id, id));
  }
}
