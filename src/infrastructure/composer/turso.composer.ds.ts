import { eq } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import { IComposerDataSource, ComposerRows } from './interfaces/composer.ds.interface';
import { getDb } from '@/infrastructure/database/drizzle-utils';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

export class TursoComposerDataSource implements IComposerDataSource {
  constructor(private db: LibSQLDatabase<typeof schema>) {}

  async findById(id: string, ctx?: TransactionContext): Promise<ComposerRows | null> {
    const db = getDb(ctx);
    const result = await db.query.composers.findFirst({
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

  async findBySlug(slug: string, ctx?: TransactionContext): Promise<ComposerRows | null> {
    const db = getDb(ctx);
    const result = await db.query.composers.findFirst({
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

  async save(rows: ComposerRows, ctx?: TransactionContext): Promise<void> {
    const execute = async (tx: TransactionContext) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dtx = tx as any;
      // 1. Upsert Composer Root
      await dtx.insert(schema.composers).values(rows.composer).onConflictDoUpdate({
        target: schema.composers.id,
        set: rows.composer,
      });

      // 2. Refresh Translations (Delete & Insert strategy for simplicity in Master Data Sync)
      await dtx
        .delete(schema.composerTranslations)
        .where(eq(schema.composerTranslations.composerId, rows.composer.id));

      if (rows.translations.length > 0) {
        await dtx.insert(schema.composerTranslations).values(rows.translations);
      }
    };

    if (ctx) {
      await execute(ctx);
    } else {
      await this.db.transaction(execute);
    }
  }

  async delete(id: string, ctx?: TransactionContext): Promise<void> {
    const db = getDb(ctx);
    await db.delete(schema.composers).where(eq(schema.composers.id, id));
  }
}
