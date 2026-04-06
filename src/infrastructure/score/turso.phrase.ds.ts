import { eq, sql } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import {
  phrases,
  phraseTranslations,
  Phrase,
  PhraseTranslation,
  NewPhrase,
  NewPhraseTranslation,
} from '@/infrastructure/database/schema/phrases';
import { IPhraseDataSource, PhraseRows } from './interfaces/phrase.ds.interface';
import { getDb } from '@/infrastructure/database/drizzle-utils';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

type PhraseWithRelations = Phrase & {
  translations?: PhraseTranslation[];
  work?: {
    id: string;
    slug: string;
    composer?: { id: string; slug: string };
  };
  workPart?: { id: string; slug: string };
  score?: { id: string; slug: string };
};

export class TursoPhraseDataSource implements IPhraseDataSource {
  constructor(private db: LibSQLDatabase<typeof schema>) {}

  async findById(id: string, ctx?: TransactionContext): Promise<PhraseRows | null> {
    const db = getDb(this.db, ctx);
    const result = (await db.query.phrases.findFirst({
      where: eq(phrases.id, id),
      with: {
        translations: true,
        work: {
          with: {
            composer: true,
          },
        },
        workPart: true,
        score: true,
      },
    })) as PhraseWithRelations | undefined;

    if (!result) return null;

    const { translations, work, workPart, score, ...phrase } = result;

    return {
      phrase,
      translations: translations || [],
      composer: work?.composer ? { slug: work.composer.slug } : undefined,
      work: work ? { slug: work.slug } : undefined,
      workPart: workPart ? { slug: workPart.slug } : undefined,
      score: score ? { slug: score.slug } : undefined,
    };
  }

  async findByWorkSlug(workSlug: string, ctx?: TransactionContext): Promise<PhraseRows[]> {
    const db = getDb(this.db, ctx);

    const workResult = await db.query.works.findFirst({
      where: eq(schema.works.slug, workSlug),
    });

    if (!workResult) return [];

    const results = (await db.query.phrases.findMany({
      where: eq(phrases.workId, workResult.id),
      with: {
        translations: true,
        work: {
          with: {
            composer: true,
          },
        },
        workPart: true,
        score: true,
      },
    })) as PhraseWithRelations[];

    return results.map((r) => {
      const { translations, work, workPart, score, ...phrase } = r;
      return {
        phrase,
        translations: translations || [],
        composer: work?.composer ? { slug: work.composer.slug } : undefined,
        work: work ? { slug: work.slug } : undefined,
        workPart: workPart ? { slug: workPart.slug } : undefined,
        score: score ? { slug: score.slug } : undefined,
      };
    });
  }

  async findMany(limit?: number, offset?: number, ctx?: TransactionContext): Promise<PhraseRows[]> {
    const db = getDb(this.db, ctx);
    const results = (await db.query.phrases.findMany({
      limit,
      offset,
      with: {
        translations: true,
        work: {
          with: {
            composer: true,
          },
        },
        workPart: true,
        score: true,
      },
    })) as PhraseWithRelations[];

    return results.map((r) => {
      const { translations, work, workPart, score, ...phrase } = r;
      return {
        phrase,
        translations: translations || [],
        composer: work?.composer ? { slug: work.composer.slug } : undefined,
        work: work ? { slug: work.slug } : undefined,
        workPart: workPart ? { slug: workPart.slug } : undefined,
        score: score ? { slug: score.slug } : undefined,
      };
    });
  }

  async upsert(rows: PhraseRows, ctx?: TransactionContext): Promise<void> {
    const execute = async (tx: Record<string, unknown>) => {
      const txDb = tx as unknown as LibSQLDatabase<typeof schema>;
      // 1. phrases 本体の Upsert
      await txDb
        .insert(phrases)
        .values(rows.phrase as NewPhrase)
        .onConflictDoUpdate({
          target: phrases.id,
          set: {
            workId: sql.raw(`excluded.work_id`),
            workPartId: sql.raw(`excluded.work_part_id`),
            scoreId: sql.raw(`excluded.score_id`),
            slug: sql.raw(`excluded.slug`),
            format: sql.raw(`excluded.format`),
            dataStoragePath: sql.raw(`excluded.data_storage_path`),
            measureRange: sql.raw(`excluded.measure_range`),
            recordingSegments: sql.raw(`excluded.recording_segments`),
            updatedAt: sql.raw(`excluded.updated_at`),
          },
        });

      // 2. 翻訳データの Refresh
      await txDb.delete(phraseTranslations).where(eq(phraseTranslations.phraseId, rows.phrase.id));

      if (rows.translations.length > 0) {
        await txDb.insert(phraseTranslations).values(rows.translations as NewPhraseTranslation[]);
      }
    };

    if (ctx) {
      await execute(ctx as unknown as Record<string, unknown>);
    } else {
      await this.db.transaction(async (tx) => {
        await execute(tx as unknown as Record<string, unknown>);
      });
    }
  }

  async deleteById(id: string, ctx?: TransactionContext): Promise<void> {
    const db = getDb(this.db, ctx);
    await db.delete(phrases).where(eq(phrases.id, id));
  }
}
