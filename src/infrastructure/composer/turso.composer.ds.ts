import { eq } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import { IComposerDataSource, ComposerRows } from './interfaces/composer.ds.interface';
import { getDb } from '@/infrastructure/database/drizzle-utils';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';
import { AppError } from '@/domain/shared/app-error';

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

  async findMany(
    params?: { limit?: number; offset?: number },
    ctx?: TransactionContext,
  ): Promise<ComposerRows[]> {
    const db = getDb(ctx);
    const result = await db.query.composers.findMany({
      limit: params?.limit,
      offset: params?.offset,
      with: {
        translations: true,
      },
      // orderBy: desc(schema.composers.createdAt), // 必要に応じて
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.map((r: any) => {
      const { translations, ...composer } = r;
      return { composer, translations: translations || [] };
    });
  }

  async save(rows: ComposerRows, ctx?: TransactionContext): Promise<void> {
    const execute = async (tx: TransactionContext) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dtx = tx as any;
      // 1. Check existing for Optimistic Locking
      const existing = await dtx.query.composers.findFirst({
        where: eq(schema.composers.id, rows.composer.id),
      });

      if (existing) {
        // If it exists, we must do an UPDATE and check rows affected (or just do the update with where clause and check)
        const updated = await dtx
          .update(schema.composers)
          .set(rows.composer)
          .where(
            eq(schema.composers.id, rows.composer.id),
            // Note: In a real Optimistic Lock scenario we'd check: eq(schema.composers.updatedAt, previousUpdatedAt)
            // However, since Turso/SQLite doesn't easily return rowsAffected in this exact generic driver setup,
            // we will simulate the check here by comparing the existing updatedAt with what the entity *was* based on.
            // For this PoC, we will assume rows.composer.updatedAt is the *new* timestamp, so we need the *old* one.
            // Since DTOs don't pass old timestamp perfectly yet in this generic mapper, we do a simple save.
            //
            // FIXME (Future): Pass oldUpdatedAt via ComposerRows and check it against `existing.updatedAt`.
            // if (existing.updatedAt !== rows.oldUpdatedAt) throw new AppError('Concurrency Conflict', 'CONCURRENCY_ERROR', 409);
          )
          .returning({ id: schema.composers.id });

        if (updated.length === 0) {
          throw new AppError(
            'Optimistic Lock Error: The record was updated by another user.',
            'CONCURRENCY_ERROR',
            409,
          );
        }
      } else {
        // Insert new
        await dtx.insert(schema.composers).values(rows.composer);
      }

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

  async deleteById(id: string, ctx?: TransactionContext): Promise<void> {
    const db = getDb(ctx);
    await db.delete(schema.composers).where(eq(schema.composers.id, id));
  }
}
