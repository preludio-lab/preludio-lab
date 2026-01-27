import { eq, and } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import { IWorkDataSource, WorkRows, WorkPartRows } from './interfaces/work.ds.interface';

export class TursoWorkDataSource implements IWorkDataSource {
  constructor(private db: LibSQLDatabase<typeof schema>) {}

  /**
   * 検索用IDで作品を取得し、関連する作曲家、翻訳、構成楽曲情報を結合して返します。
   */
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

  /**
   * 作曲家IDと作品スラッグで作品を検索します。
   */
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

  /**
   * 作品情報、翻訳、構成楽曲を一括して保存・更新します（トランザクション処理）。
   */
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

  /**
   * 指定されたIDの作品を削除します。
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(schema.works).where(eq(schema.works.id, id));
  }

  // --- Part Operations ---

  /**
   * 単一の構成楽曲（楽章）を保存・更新します。
   */
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

  /**
   * 指定された作品IDに紐づく全ての構成楽曲（楽章）を削除します。
   */
  async deletePartsByWorkId(workId: string): Promise<void> {
    await this.db.delete(schema.workParts).where(eq(schema.workParts.workId, workId));
  }

  /**
   * IDでWorkPartを検索し、翻訳データも含めて返します。
   */
  async findPartById(partId: string): Promise<WorkPartRows | null> {
    const part = await this.db.query.workParts.findFirst({
      where: eq(schema.workParts.id, partId),
    });

    if (!part) return null;

    const translations = await this.db.query.workPartTranslations.findMany({
      where: eq(schema.workPartTranslations.workPartId, partId),
    });

    return {
      part,
      translations,
    };
  }

  /**
   * IDでWorkPartを削除します。
   */
  async deletePart(partId: string): Promise<void> {
    await this.db.delete(schema.workParts).where(eq(schema.workParts.id, partId));
  }
}
