import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { libsqlVector } from './custom-types';
import { sql } from 'drizzle-orm';
import { works } from './works';

// Domain Types (for JSON columns)
import type { ContentStructure } from '@/domain/article/article.content';
import type { SeriesAssignment } from '@/domain/article/article.context';
import type { ArticleMetadata, ImpressionDimensions } from '@/domain/article/article.metadata';

// --- Articles Table ---
export const articles = sqliteTable(
  'articles',
  {
    id: text('id').primaryKey(), // UUID v7
    workId: text('work_id').references(() => works.id, { onDelete: 'set null' }),
    slug: text('slug').notNull(), // ユニバーサルスラグ
    category: text('category').notNull(), // [Master] Article Category
    isFeatured: integer('is_featured', { mode: 'boolean' }).default(false).notNull(),
    readingTimeSeconds: integer('reading_time_seconds').default(0).notNull(),
    thumbnailPath: text('thumbnail_path'), // [Universal Asset]
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    workIdIdx: index('idx_articles_work_id').on(table.workId),
    slugIdx: uniqueIndex('idx_articles_slug').on(table.slug),
    featuredIdx: index('idx_articles_featured').on(table.isFeatured, table.createdAt),
  }),
);

// --- Article Translations Table ---
export const articleTranslations = sqliteTable(
  'article_translations',
  {
    id: text('id').primaryKey(),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(),
    status: text('status', {
      enum: ['draft', 'scheduled', 'published', 'private', 'archived'],
    }).notNull(),
    title: text('title').notNull(),
    displayTitle: text('display_title').notNull(),
    catchcopy: text('catchcopy'),
    excerpt: text('excerpt'),
    publishedAt: text('published_at'), // ISO8601 または NULL
    isFeatured: integer('is_featured', { mode: 'boolean' }).default(false).notNull(),
    // 生成カラムの定義
    mdxPath: text('mdx_path').generatedAlwaysAs(
      // 例: "ja/symphony/beethoven-5" (末尾スラッシュなし)
      sql`lang || '/' || sl_category || '/' || sl_slug`,
      { mode: 'stored' },
    ),

    // --- 非正規化カラム (Snapshots) ---
    slSlug: text('sl_slug').notNull(), // [Snapshot/Localized]
    slCategory: text('sl_category').notNull(), // [Snapshot]
    slComposerName: text('sl_composer_name'),
    slWorkCatalogueId: text('sl_work_catalogue_id'),
    slWorkNicknames: text('sl_work_nicknames', { mode: 'json' }).$type<string[]>(),
    slGenre: text('sl_genre', { mode: 'json' }).$type<string[]>(), // Design docによればJSONの文字列リストとして格納
    // デザインドキュメント: `sl_genre` text - "Genre List (JSON)". JSONとして扱います。
    slInstrumentations: text('sl_instrumentations', { mode: 'json' }).$type<string[]>(),
    slEra: text('sl_era'), // 単一値。 "Era (Source: works.era)"
    slNationality: text('sl_nationality'),
    slKey: text('sl_key'),
    slPerformanceDifficulty: integer('sl_performance_difficulty'),
    slImpressionDimensions: text('sl_impression_dimensions', {
      mode: 'json',
    }).$type<ImpressionDimensions>(),

    // --- ベクトル埋め込み (Vector Embedding) ---
    // 384次元: intfloat/multilingual-e5-small
    contentEmbedding: libsqlVector(384)('content_embedding'),

    // --- Metadata & Structure ---
    slSeriesAssignments: text('sl_series_assignments', { mode: 'json' })
      .default('[]')
      .notNull()
      .$type<SeriesAssignment[]>(),
    metadata: text('metadata', { mode: 'json' }).default('{}').notNull().$type<ArticleMetadata>(),
    contentStructure: text('content_structure', { mode: 'json' })
      .default('{}')
      .notNull()
      .$type<ContentStructure>(),

    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    mdxPathIdx: uniqueIndex('idx_art_trans_mdx_path').on(table.mdxPath),
    lookupIdx: uniqueIndex('idx_art_trans_article_lookup').on(table.articleId, table.lang),
    statusPubIdx: index('idx_art_trans_status_pub').on(table.lang, table.status, table.publishedAt),
    featuredIdx: index('idx_art_trans_featured').on(
      table.lang,
      table.isFeatured,
      table.publishedAt,
    ),
    genreIdx: index('idx_art_trans_search_genre').on(table.lang, table.slGenre),
    eraIdx: index('idx_art_trans_search_era').on(table.lang, table.slEra),
    compIdx: index('idx_art_trans_search_comp').on(table.lang, table.slComposerName),
    compoundFilterIdx: index('idx_art_trans_compound_filter').on(
      table.lang,
      table.status,
      table.isFeatured,
      table.publishedAt,
    ),
    // vector index は通常、生のSQLで作成されます
  }),
);

// --- Series Table ---
export const series = sqliteTable(
  'series',
  {
    id: text('id').primaryKey(),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'restrict' }), // "このシリーズの親記事"
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    articleIdIdx: uniqueIndex('idx_series_article_id').on(table.articleId),
  }),
);

// --- Series Articles Table ---
export const seriesArticles = sqliteTable(
  'series_articles',
  {
    seriesId: text('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    lookupIdx: uniqueIndex('idx_ser_art_lookup').on(table.seriesId, table.articleId),
    orderIdx: index('idx_ser_art_order').on(table.seriesId, table.sortOrder),
    articleIdx: index('idx_ser_art_article').on(table.articleId),
  }),
);
