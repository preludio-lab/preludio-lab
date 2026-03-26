import { eq, and, or, like, desc, asc, count } from 'drizzle-orm';
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
    const conditions = [
      eq(schema.workTranslations.lang, lang),
      eq(schema.composerTranslations.lang, lang),
    ];

    if (filter?.composerId) {
      conditions.push(eq(schema.works.composerId, filter.composerId));
    }
    if (filter?.era) {
      conditions.push(eq(schema.works.era, filter.era));
    }
    if (filter?.keyword) {
      conditions.push(
        or(
          like(schema.workTranslations.title, `%${filter.keyword}%`),
          like(schema.composerTranslations.displayName, `%${filter.keyword}%`),
        )!,
      );
    }

    const where = and(...conditions);

    // 2. 総件数の取得
    const countResult = await db
      .select({ val: count() })
      .from(schema.works)
      .innerJoin(schema.workTranslations, eq(schema.works.id, schema.workTranslations.workId))
      .innerJoin(schema.composers, eq(schema.works.composerId, schema.composers.id))
      .innerJoin(
        schema.composerTranslations,
        eq(schema.composers.id, schema.composerTranslations.composerId),
      )
      .where(where!);

    const totalCount = Number(countResult[0]?.val ?? 0);

    // 3. データの取得
    const orderFn = sort.direction === 'desc' ? desc : asc;
    const orderBy = [];
    if (sort.field === 'title') {
      orderBy.push(orderFn(schema.workTranslations.title));
    } else if (sort.field === 'compositionYear') {
      orderBy.push(orderFn(schema.works.compositionYear));
    } else {
      orderBy.push(orderFn(schema.works.createdAt));
    }

    const rows = await db
      .select({
        id: schema.works.id,
        slug: schema.works.slug,
        localizedTitle: schema.workTranslations.title,
        compositionYear: schema.works.compositionYear,
        cataloguePrefix: schema.works.cataloguePrefix,
        catalogueNumber: schema.works.catalogueNumber,
        genres: schema.works.genres,
        composerSlug: schema.composers.slug,
        composerName: schema.composerTranslations.displayName,
      })
      .from(schema.works)
      .innerJoin(schema.workTranslations, eq(schema.works.id, schema.workTranslations.workId))
      .innerJoin(schema.composers, eq(schema.works.composerId, schema.composers.id))
      .innerJoin(
        schema.composerTranslations,
        eq(schema.composers.id, schema.composerTranslations.composerId),
      )
      .where(where!)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    // 4. Raw レスポンスへのマッピング
    const items: RawWorkSummary[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      localizedTitle: row.localizedTitle,
      compositionYear: row.compositionYear,
      cataloguePrefix: row.cataloguePrefix,
      catalogueNumber: row.catalogueNumber,
      genres: row.genres,
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
