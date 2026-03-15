import { eq, sql, inArray } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import { IComposerDataSource, ComposerRows } from './interfaces/composer.ds.interface';
import { getDb } from '@/infrastructure/database/drizzle-utils';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

export class TursoComposerDataSource implements IComposerDataSource {
  constructor(private db: LibSQLDatabase<typeof schema>) {}

  async findById(id: string, ctx?: TransactionContext): Promise<ComposerRows | null> {
    const db = getDb(this.db, ctx);
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
    const db = getDb(this.db, ctx);
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

  async findBySlugs(slugs: string[], ctx?: TransactionContext): Promise<ComposerRows[]> {
    if (slugs.length === 0) return [];
    const db = getDb(this.db, ctx);

    const results: ComposerRows[] = [];
    const chunkSize = 100;

    for (let i = 0; i < slugs.length; i += chunkSize) {
      const chunk = slugs.slice(i, i + chunkSize);
      const rows = await db.query.composers.findMany({
        where: inArray(schema.composers.slug, chunk),
        with: {
          translations: true,
        },
      });

      for (const r of rows) {
        const { translations, ...composer } = r;
        results.push({ composer, translations: translations || [] });
      }
    }

    return results;
  }

  async findMany(
    params?: { limit?: number; offset?: number },
    ctx?: TransactionContext,
  ): Promise<ComposerRows[]> {
    const db = getDb(this.db, ctx);
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
    await this.saveMany([rows], ctx);
  }

  async saveMany(rowsList: ComposerRows[], ctx?: TransactionContext): Promise<void> {
    if (rowsList.length === 0) return;

    const execute = async (tx: TransactionContext) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dtx = tx as any;

      const composerData = rowsList.map((r) => r.composer);
      const composerIds = composerData.map((c) => c.id);

      // 1. Bulk Upsert Composers with Chunking
      // SQLite parameter limit workaround
      const composerChunkSize = 20;
      for (let i = 0; i < composerData.length; i += composerChunkSize) {
        const chunk = composerData.slice(i, i + composerChunkSize);
        await dtx
          .insert(schema.composers)
          .values(chunk)
          .onConflictDoUpdate({
            target: schema.composers.id,
            set: {
              slug: sql.raw(`excluded.slug`),
              era: sql.raw(`excluded.era`),
              birthDate: sql.raw(`excluded.birth_date`),
              deathDate: sql.raw(`excluded.death_date`),
              nationalityCode: sql.raw(`excluded.nationality_code`),
              representativeInstruments: sql.raw(`excluded.representative_instruments`),
              representativeGenres: sql.raw(`excluded.representative_genres`),
              places: sql.raw(`excluded.places`),
              impressionDimensions: sql.raw(`excluded.impression_dimensions`),
              tags: sql.raw(`excluded.tags`),
              portraitImagePath: sql.raw(`excluded.portrait_image_path`),
              updatedAt: sql.raw(`excluded.updated_at`),
            },
          });
      }

      // 2. Refresh Translations (Bulk Delete & Bulk Insert) with Chunking
      for (let i = 0; i < composerIds.length; i += 50) {
        const idChunk = composerIds.slice(i, i + 50);
        await dtx
          .delete(schema.composerTranslations)
          .where(inArray(schema.composerTranslations.composerId, idChunk));
      }

      const allTranslations = rowsList.flatMap((r) => r.translations);
      if (allTranslations.length > 0) {
        const transChunkSize = 30;
        for (let i = 0; i < allTranslations.length; i += transChunkSize) {
          const chunk = allTranslations.slice(i, i + transChunkSize);
          await dtx.insert(schema.composerTranslations).values(chunk);
        }
      }
    };

    if (ctx) {
      await execute(ctx);
    } else {
      await this.db.transaction(execute);
    }
  }

  async deleteById(id: string, ctx?: TransactionContext): Promise<void> {
    const db = getDb(this.db, ctx);
    await db.delete(schema.composers).where(eq(schema.composers.id, id));
  }

  async deleteBySlugs(slugs: string[], ctx?: TransactionContext): Promise<void> {
    if (slugs.length === 0) return;
    const db = getDb(this.db, ctx);

    // Chunking for IN clause
    for (let i = 0; i < slugs.length; i += 100) {
      const slugChunk = slugs.slice(i, i + 100);
      await db.delete(schema.composers).where(inArray(schema.composers.slug, slugChunk));
    }
  }
}
