import { eq, like, or } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import {
  IComposerSearchQueryService,
  ComposerSearchResult,
} from '@/application/composer/query/composer-search-query.interface';

/**
 * Turso Composer Search Query Service
 * Async Typeahead 用の作曲家名前検索。
 * IComposerSearchQueryService ポートの Turso 実装。
 */
export class TursoComposerSearchQueryService implements IComposerSearchQueryService {
  constructor(private readonly db: LibSQLDatabase<typeof schema>) {}

  async searchByName(query: string, lang: string, limit = 10): Promise<ComposerSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const pattern = `%${query.trim()}%`;

    const rows = await this.db
      .select({
        id: schema.composers.id,
        slug: schema.composers.slug,
        displayName: schema.composerTranslations.displayName,
      })
      .from(schema.composers)
      .innerJoin(
        schema.composerTranslations,
        eq(schema.composers.id, schema.composerTranslations.composerId),
      )
      .where(
        or(
          like(schema.composerTranslations.displayName, pattern),
          like(schema.composerTranslations.fullName, pattern),
          like(schema.composers.slug, pattern),
        ),
      )
      .limit(limit);

    // displayName で lang 一致を優先、なければ最初のものを使うため dedup
    const map = new Map<string, ComposerSearchResult>();
    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          slug: row.slug,
          displayName: row.displayName,
        });
      }
    }

    return Array.from(map.values());
  }
}
