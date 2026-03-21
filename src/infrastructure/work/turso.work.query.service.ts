import { eq, and, or, like, desc, asc, count, SQL } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import {
  WorkQueryService,
  RawWorkSummary,
  RawPagedResponse,
} from '@/application/work/query/work-query.interface';
import { WorkSearchRequestParams } from '@/application/work/dto/search-works.dto';

/**
 * Turso Work Query Service
 * 作品の検索・一覧取得に特化した Turso (LibSQL) 実装。
 * 読み取り専用のため TransactionManager をバイパスし、軽量なクエリを実行します。
 */
export class TursoWorkQueryService implements WorkQueryService {
  constructor(private readonly db: LibSQLDatabase<typeof schema>) {}

  /**
   * 検索条件に基づいて作品の Raw データを取得します。
   */
  async searchWorks(params: WorkSearchRequestParams): Promise<RawPagedResponse<RawWorkSummary>> {
    const { lang, filter, sort, pagination } = params;
    const { limit, offset } = pagination;
    const db = this.db;

    // 1. フィルタ条件の構築
    const conditions: SQL[] = [
      (eq as unknown as (a: unknown, b: unknown) => SQL)(schema.workTranslations.lang, lang),
      (eq as unknown as (a: unknown, b: unknown) => SQL)(schema.composerTranslations.lang, lang),
    ];

    if (filter?.composerId) {
      conditions.push(
        (eq as unknown as (a: unknown, b: unknown) => SQL)(
          schema.works.composerId,
          filter.composerId,
        ),
      );
    }
    if (filter?.era) {
      conditions.push(
        (eq as unknown as (a: unknown, b: unknown) => SQL)(schema.works.era, filter.era),
      );
    }
    if (filter?.keyword) {
      const keywordMatch = (or as unknown as (...args: unknown[]) => SQL)(
        (like as unknown as (a: unknown, b: unknown) => SQL)(
          schema.workTranslations.title,
          `%${filter.keyword}%`,
        ),
        (like as unknown as (a: unknown, b: unknown) => SQL)(
          schema.composerTranslations.displayName,
          `%${filter.keyword}%`,
        ),
      );
      if (keywordMatch) {
        conditions.push(keywordMatch);
      }
    }

    const where = (and as unknown as (...args: unknown[]) => SQL)(...conditions);

    // 2. 総件数の取得
    const countResult = (await (db
      .select({ val: (count as unknown as () => SQL)() })
      .from(schema.works)
      .innerJoin(
        schema.workTranslations,
        (eq as unknown as (a: unknown, b: unknown) => SQL)(
          schema.works.id,
          schema.workTranslations.workId,
        ),
      )
      .innerJoin(
        schema.composers,
        (eq as unknown as (a: unknown, b: unknown) => SQL)(
          schema.works.composerId,
          schema.composers.id,
        ),
      )
      .innerJoin(
        schema.composerTranslations,
        (eq as unknown as (a: unknown, b: unknown) => SQL)(
          schema.composers.id,
          schema.composerTranslations.composerId,
        ),
      )
      .where(where) as unknown as Promise<{ val: number }[]>)) as { val: number }[];

    const totalCount = Number(countResult[0]?.val ?? 0);

    // 3. データの取得
    const orderFn = sort.direction === 'desc' ? desc : asc;
    const orderBy = [];
    if (sort.field === 'title') {
      orderBy.push((orderFn as unknown as (a: unknown) => SQL)(schema.workTranslations.title));
    } else if (sort.field === 'compositionYear') {
      orderBy.push((orderFn as unknown as (a: unknown) => SQL)(schema.works.compositionYear));
    } else {
      orderBy.push((orderFn as unknown as (a: unknown) => SQL)(schema.works.createdAt));
    }

    interface QueryRow {
      id: string;
      slug: string;
      localizedTitle: string;
      compositionYear: number | null;
      composerSlug: string;
      composerName: string;
    }

    const rows = (await (db
      .select({
        id: schema.works.id,
        slug: schema.works.slug,
        localizedTitle: schema.workTranslations.title,
        compositionYear: schema.works.compositionYear,
        composerSlug: schema.composers.slug,
        composerName: schema.composerTranslations.displayName,
      })
      .from(schema.works)
      .innerJoin(
        schema.workTranslations,
        (eq as unknown as (a: unknown, b: unknown) => SQL)(
          schema.works.id,
          schema.workTranslations.workId,
        ),
      )
      .innerJoin(
        schema.composers,
        (eq as unknown as (a: unknown, b: unknown) => SQL)(
          schema.works.composerId,
          schema.composers.id,
        ),
      )
      .innerJoin(
        schema.composerTranslations,
        (eq as unknown as (a: unknown, b: unknown) => SQL)(
          schema.composers.id,
          schema.composerTranslations.composerId,
        ),
      )
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset) as unknown as Promise<QueryRow[]>)) as QueryRow[];

    // 4. Raw レスポンスへのマッピング
    const items: RawWorkSummary[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      localizedTitle: row.localizedTitle,
      compositionYear: row.compositionYear,
      composer: {
        slug: row.composerSlug,
        name: row.composerName,
      },
    }));

    return {
      items,
      totalCount,
      hasNextPage: offset + items.length < totalCount,
    };
  }
}
