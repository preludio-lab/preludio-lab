import { eq } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import { IScoreDataSource, ScoreRows } from './interfaces/score.ds.interface';
import { getDb } from '@/infrastructure/database/drizzle-utils';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

export class TursoScoreDataSource implements IScoreDataSource {
  constructor(private db: LibSQLDatabase<typeof schema>) {}

  async findById(id: string, ctx?: TransactionContext): Promise<ScoreRows | null> {
    const db = getDb(this.db, ctx);
    const result = await db.query.scores.findFirst({
      where: eq(schema.scores.id, id),
      with: {
        translations: true,
      },
    });

    if (!result) return null;

    const { translations, ...score } = result;

    return {
      score,
      translations: translations || [],
    };
  }

  /**
   * スラグに基づく解決 (現状は ID で代用、将来の Slug カラム対応時に修正)
   */
  async findBySlug(slug: string, ctx?: TransactionContext): Promise<ScoreRows | null> {
    const db = getDb(this.db, ctx);
    const result = await db.query.scores.findFirst({
      where: eq(schema.scores.id, slug), // Temporary ID-based resolution
      with: {
        translations: true,
      },
    });

    if (!result) return null;

    const { translations, ...score } = result;
    return {
      score,
      translations: translations || [],
    };
  }
}
