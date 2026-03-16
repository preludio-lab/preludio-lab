import { eq, and } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import { IWorkDataSource, WorkRows, WorkPartRows } from './interfaces/work.ds.interface';
import { getDb } from '@/infrastructure/database/drizzle-utils';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

export class TursoWorkDataSource implements IWorkDataSource {
  constructor(private db: LibSQLDatabase<typeof schema>) {}

  /**
   * 検索用IDで作品を取得し、関連する作曲家、翻訳、構成楽曲情報を結合して返します。
   */
  async findById(id: string, ctx?: TransactionContext): Promise<WorkRows | null> {
    const db = getDb(this.db, ctx);
    const workResult = await db.query.works.findFirst({
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

    const translations = await db.query.workTranslations.findMany({
      where: eq(schema.workTranslations.workId, id),
    });

    const parts = await db.query.workParts.findMany({
      where: eq(schema.workParts.workId, id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderBy: (parts: any, { asc }: any) => [asc(parts.sortOrder)],
    });

    const populatedParts = await Promise.all(
      // @ts-expect-error - part type is implicitly any from drizzle output
      parts.map(async (part) => {
        const partTrans = await db.query.workPartTranslations.findMany({
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
  async findBySlug(
    composerId: string,
    slug: string,
    ctx?: TransactionContext,
  ): Promise<WorkRows | null> {
    const db = getDb(this.db, ctx);
    const workResult = await db.query.works.findFirst({
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
    return this.findById(workResult.id, ctx);
  }

  /**
   * 作品情報、翻訳、構成楽曲を一括して保存・更新します（トランザクション処理）。
   */
  async save(rows: WorkRows, ctx?: TransactionContext): Promise<void> {
    /**
     * ctx が渡されている場合はそれを使用し、同じトランザクション内で実行します。
     * 渡されていない場合は新規にトランザクションを開始します。
     */
    const execute = async (tx: TransactionContext) => {
      // Drizzle のトランザクションインスタンスとして扱うためキャスト
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dtx = tx as any;
      // 1. Upsert Work Root
      await dtx.insert(schema.works).values(rows.work).onConflictDoUpdate({
        target: schema.works.id,
        set: rows.work,
      });

      // 2. Work Translations (Replace)
      await dtx
        .delete(schema.workTranslations)
        .where(eq(schema.workTranslations.workId, rows.work.id));

      if (rows.translations.length > 0) {
        await dtx.insert(schema.workTranslations).values(rows.translations);
      }

      // 3. Work Parts (Optional)
      if (rows.parts !== undefined) {
        await dtx.delete(schema.workParts).where(eq(schema.workParts.workId, rows.work.id));

        if (rows.parts.length > 0) {
          /**
           * Batch Insert による最適化
           * 全てのパート本体を一括で挿入します。
           */
          const partRows = rows.parts.map((p) => p.part);
          await dtx.insert(schema.workParts).values(partRows);

          /** 各パートの翻訳を挿入 */
          for (const p of rows.parts) {
            if (p.translations.length > 0) {
              await dtx.insert(schema.workPartTranslations).values(p.translations);
            }
          }
        }
      }
    };

    if (ctx) {
      await execute(ctx);
    } else {
      await this.db.transaction(execute);
    }
  }

  /**
   * 指定されたIDの作品を削除します。
   */
  async deleteById(id: string, ctx?: TransactionContext): Promise<void> {
    const db = getDb(this.db, ctx);
    await db.delete(schema.works).where(eq(schema.works.id, id));
  }

  // --- Part Operations ---

  /**
   * 単一の構成楽曲（楽章）を保存・更新します。
   */
  async savePart(rows: WorkPartRows, ctx?: TransactionContext): Promise<void> {
    const execute = async (tx: TransactionContext) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dtx = tx as any;
      await dtx.insert(schema.workParts).values(rows.part).onConflictDoUpdate({
        target: schema.workParts.id,
        set: rows.part,
      });

      await dtx
        .delete(schema.workPartTranslations)
        .where(eq(schema.workPartTranslations.workPartId, rows.part.id));

      if (rows.translations.length > 0) {
        await dtx.insert(schema.workPartTranslations).values(rows.translations);
      }
    };

    if (ctx) {
      await execute(ctx);
    } else {
      await this.db.transaction(execute);
    }
  }

  /**
   * 複数の構成楽曲（楽章）を一括保存・更新します。
   * トランザクション内でループ処理を行うことで、個別のトランザクションオーバーヘッドを回避します。
   */
  async saveParts(rowsList: WorkPartRows[], ctx?: TransactionContext): Promise<void> {
    const execute = async (tx: TransactionContext) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dtx = tx as any;
      /** Batch Insert による最適化 */
      const partRows = rowsList.map((r) => r.part);
      await dtx
        .insert(schema.workParts)
        .values(partRows)
        .onConflictDoUpdate({
          target: schema.workParts.id,
          set: { updatedAt: new Date() }, // 実際は各行個別の値が必要だが、一括の場合は簡易化される場合がある
          // NOTE: DrizzleのonConflictDoUpdateで複数の行を個別に更新するのは複雑なため、
          // 既存の saveParts が各行 insert...onConflict していた意図を汲む。
        });

      /**
       * 注意: Drizzleの一括upsertは `set` 句の内容が全行共通になる。
       * パフォーマンス重視だが、個別の更新が必要な場合はループが必要。
       * ここでは既存のロジックがループだったので、安全にループ+Batch Insertの折衷案とする。
       */
      for (const rows of rowsList) {
        await dtx.insert(schema.workParts).values(rows.part).onConflictDoUpdate({
          target: schema.workParts.id,
          set: rows.part,
        });

        await dtx
          .delete(schema.workPartTranslations)
          .where(eq(schema.workPartTranslations.workPartId, rows.part.id));

        if (rows.translations.length > 0) {
          await dtx.insert(schema.workPartTranslations).values(rows.translations);
        }
      }
    };

    if (ctx) {
      await execute(ctx);
    } else {
      await this.db.transaction(execute);
    }
  }

  /**
   * 指定された作品IDに紐づく全ての構成楽曲（楽章）を削除します。
   */
  async deletePartsByWorkId(workId: string, ctx?: TransactionContext): Promise<void> {
    const db = getDb(this.db, ctx);
    await db.delete(schema.workParts).where(eq(schema.workParts.workId, workId));
  }

  /**
   * IDでWorkPartを検索し、翻訳データも含めて返します。
   */
  async findPartById(partId: string, ctx?: TransactionContext): Promise<WorkPartRows | null> {
    const db = getDb(this.db, ctx);
    const part = await db.query.workParts.findFirst({
      where: eq(schema.workParts.id, partId),
    });

    if (!part) return null;

    const translations = await db.query.workPartTranslations.findMany({
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
  async deletePartById(partId: string, ctx?: TransactionContext): Promise<void> {
    const db = getDb(this.db, ctx);
    await db.delete(schema.workParts).where(eq(schema.workParts.id, partId));
  }
}
