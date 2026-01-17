import { sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { works, workParts } from './works';
import type { MonetizationElement } from '@/domain/monetization/monetization';
import type { RecordingSegment } from '@/domain/recording/recording-segment';
import type { MeasureRange } from '@/domain/score/musical-example-metadata';

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

// --- Musical Examples Table ---
export const musicalExamples = sqliteTable(
  'musical_examples',
  {
    id: text('id').primaryKey(), // UUID v7
    workId: text('work_id')
      .notNull()
      .references(() => works.id, { onDelete: 'cascade' }),
    workPartId: text('work_part_id').references(() => workParts.id), // Nullable (entire work)
    scoreId: text('score_id').references(() => scores.id), // Nullable (self-made/unknown)
    slug: text('slug').notNull(),
    format: text('format').notNull(), // 'abc', 'musicxml'
    dataStoragePath: text('data_storage_path').notNull(), // R2 path

    measureRange: text('measure_range', { mode: 'json' }).$type<MeasureRange>(),

    // Renamed from playback_bindings (JSON, Nullable)
    recordingSegments: text('recording_segments', { mode: 'json' })
      .default('[]')
      .notNull()
      .$type<RecordingSegment[]>(),

    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    workIdx: index('idx_mus_ex_work_id').on(table.workId),
    partIdx: index('idx_mus_ex_work_part').on(table.workPartId),
    scoreIdx: index('idx_mus_ex_score_id').on(table.scoreId),
    slugIdx: uniqueIndex('idx_mus_ex_slug').on(table.workId, table.slug),
  }),
);
