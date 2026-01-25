import { eq, and } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import { IWorkDataSource, WorkRows, WorkPartRows } from './interfaces/work.ds.interface';

export class TursoWorkDataSource implements IWorkDataSource {
  constructor(private db: LibSQLDatabase<typeof schema>) {}

  async findById(id: string): Promise<WorkRows | null> {
    const workResult = await this.db.query.works.findFirst({
      where: eq(schema.works.id, id),
      with: {
        composer: {
          columns: {
            slug: true,
          },
        },
      },
    });

    if (!workResult) return null;

    const { composer, ...work } = workResult;

    const translations = await this.db.query.workTranslations.findMany({
      where: eq(schema.workTranslations.workId, id),
    });

    const parts = await this.db.query.workParts.findMany({
      where: eq(schema.workParts.workId, id),
      orderBy: (parts, { asc }) => [asc(parts.sortOrder)],
    });

    const populatedParts = await Promise.all(
      parts.map(async (part) => {
        const partTrans = await this.db.query.workPartTranslations.findMany({
          where: eq(schema.workPartTranslations.workPartId, part.id),
        });
        return {
          part,
          translations: partTrans,
        };
      }),
    );

    return {
      work,
      translations,
      parts: populatedParts,
      composer,
    };
  }

  async findBySlug(composerId: string, slug: string): Promise<WorkRows | null> {
    const workResult = await this.db.query.works.findFirst({
      where: and(eq(schema.works.composerId, composerId), eq(schema.works.slug, slug)),
      with: {
        composer: {
          columns: {
            slug: true,
          },
        },
      },
    });

    if (!workResult) return null;
    return this.findById(workResult.id);
  }

  async save(rows: WorkRows): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 1. Upsert Work Root
      await tx.insert(schema.works).values(rows.work).onConflictDoUpdate({
        target: schema.works.id,
        set: rows.work,
      });

      // 2. Work Translations (Replace)
      await tx
        .delete(schema.workTranslations)
        .where(eq(schema.workTranslations.workId, rows.work.id));

      if (rows.translations.length > 0) {
        await tx.insert(schema.workTranslations).values(rows.translations);
      }

      // 3. Work Parts (Optional)
      if (rows.parts !== undefined) {
        await tx.delete(schema.workParts).where(eq(schema.workParts.workId, rows.work.id));

        if (rows.parts.length > 0) {
          for (const p of rows.parts) {
            await tx.insert(schema.workParts).values(p.part);
            if (p.translations.length > 0) {
              await tx.insert(schema.workPartTranslations).values(p.translations);
            }
          }
        }
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schema.works).where(eq(schema.works.id, id));
  }

  // --- Part Operations ---

  async savePart(rows: WorkPartRows): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(schema.workParts).values(rows.part).onConflictDoUpdate({
        target: schema.workParts.id, // ID match required
        set: rows.part,
      });

      await tx
        .delete(schema.workPartTranslations)
        .where(eq(schema.workPartTranslations.workPartId, rows.part.id));

      if (rows.translations.length > 0) {
        await tx.insert(schema.workPartTranslations).values(rows.translations);
      }
    });
  }

  async deletePartsByWorkId(workId: string): Promise<void> {
    await this.db.delete(schema.workParts).where(eq(schema.workParts.workId, workId));
  }
}
