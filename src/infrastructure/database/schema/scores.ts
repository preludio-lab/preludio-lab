import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { works, workParts } from './works';
import type { MonetizationElement } from '@/domain/monetization/monetization';

// --- Scores Table ---
export const scores = sqliteTable(
  'scores',
  {
    id: text('id').primaryKey(), // UUID v7
    isbn: text('isbn'),
    gtin: text('gtin'),
    affiliateLinks: text('affiliate_links', { mode: 'json' })
      .default('[]')
      .notNull()
      .$type<MonetizationElement[]>(),
    previewUrl: text('preview_url'),
    format: text('format'), // 'physical' | 'digital'

    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    isbnIdx: index('idx_scores_isbn').on(table.isbn),
  }),
);

// --- Score Translations Table ---
export const scoreTranslations = sqliteTable(
  'score_translations',
  {
    id: text('id').primaryKey(),
    scoreId: text('score_id')
      .notNull()
      .references(() => scores.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(),
    publisher: text('publisher'),
    editor: text('editor'),
    edition: text('edition'),

    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    lookupIdx: uniqueIndex('idx_score_trans_lookup').on(table.scoreId, table.lang),
  }),
);

// --- Score Works Table (N:N) ---
export const scoreWorks = sqliteTable(
  'score_works',
  {
    scoreId: text('score_id')
      .notNull()
      .references(() => scores.id, { onDelete: 'cascade' }),
    workId: text('work_id')
      .notNull()
      .references(() => works.id, { onDelete: 'cascade' }),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    pk: uniqueIndex('idx_score_works_lookup').on(table.scoreId, table.workId),
    workIdx: index('idx_score_works_work').on(table.workId),
  }),
);

// --- Score Sources Table (Deterministic Retrieval) ---
export const scoreSources = sqliteTable(
  'score_sources',
  {
    id: text('id').primaryKey(), // UUID v7
    workId: text('work_id')
      .notNull()
      .references(() => works.id, { onDelete: 'cascade' }),
    workPartId: text('work_part_id').references(() => workParts.id), // Movement specific source
    scoreId: text('score_id').references(() => scores.id), // Edition source
    provider: text('provider').notNull(), // 'github' | 'r2'
    repositoryOwner: text('repository_owner'),
    repositoryName: text('repository_name'),
    commitHash: text('commit_hash').notNull(), // Immutability: 40-char hash
    filePath: text('file_path').notNull(),
    format: text('format').notNull(), // 'kern' | 'musicxml' | 'mei' | 'mxl'
    workPartNumber: integer('work_part_number').default(0).notNull(),
    workPartTitle: text('work_part_title'),
    workPartSlug: text('work_part_slug').notNull(), // Linkage to work_parts.slug
    license: text('license'),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    workIdx: index('idx_score_src_work').on(table.workId),
    partIdx: index('idx_score_src_part').on(table.workPartId),
    scoreIdx: index('idx_score_src_score').on(table.scoreId),
    lookupIdx: uniqueIndex('idx_score_src_lookup').on(
      table.workId,
      table.workPartSlug,
      table.provider,
    ),
    versionIdx: index('idx_score_src_version').on(table.repositoryName, table.commitHash),
  }),
);
