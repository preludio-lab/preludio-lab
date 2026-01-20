import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { composers } from './composers';
import type { ImpressionDimensions, Catalogue, BasedOn } from '@/domain/work/work.shared';
import type { MultilingualString } from '@/domain/i18n/locale';
import type { MusicalGenre } from '@/domain/shared/musical-genre';

// Local interface for InstrumentationFlags (avoiding complex Zod import/inference in schema)
type InstrumentationFlags = {
  isSolo: boolean;
  isChamber: boolean;
  isOrchestral: boolean;
  hasChorus: boolean;
  hasVocal: boolean;
};

// --- Works Table ---
export const works = sqliteTable(
  'works',
  {
    id: text('id').primaryKey(), // UUID v7
    composerId: text('composer_id')
      .notNull()
      .references(() => composers.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    catalogues: text('catalogues', { mode: 'json' }).default('[]').notNull().$type<Catalogue[]>(),
    cataloguePrefix: text('catalogue_prefix'), // e.g. 'op', 'bwv' (Legacy)
    catalogueNumber: text('catalogue_number'), // e.g. '67' (Legacy)
    catalogueSortOrder: real('catalogue_sort_order'), // (Legacy)
    era: text('era'), // MusicalEra ID
    instrumentation: text('instrumentation'),
    instrumentationFlags: text('instrumentation_flags', { mode: 'json' })
      .default('{}')
      .notNull()
      .$type<InstrumentationFlags>(),
    performanceDifficulty: integer('performance_difficulty'), // 1-5
    keyTonality: text('key_tonality'),
    tempoText: text('tempo_text'),
    tsNumerator: integer('ts_numerator'),
    tsDenominator: integer('ts_denominator'),
    tsDisplayString: text('ts_display_string'),
    bpm: integer('bpm'),
    metronomeUnit: text('metronome_unit'),
    impressionDimensions: text('impression_dimensions', {
      mode: 'json',
    }).$type<ImpressionDimensions>(),
    genres: text('genres', { mode: 'json' }).default('[]').notNull().$type<MusicalGenre[]>(),
    tags: text('tags', { mode: 'json' }).default('[]').notNull().$type<string[]>(),
    compositionYear: integer('composition_year'),
    compositionPeriod: text('composition_period'), // (Legacy)
    basedOn: text('based_on', { mode: 'json' }).$type<BasedOn>(),

    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    composerIdx: index('idx_works_composer_id').on(table.composerId),
    slugIdx: uniqueIndex('idx_works_slug').on(table.composerId, table.slug),
    catalogueIdx: index('idx_works_catalogue').on(
      table.composerId,
      table.cataloguePrefix,
      table.catalogueSortOrder,
    ),
  }),
);

// --- Work Translations Table ---
export const workTranslations = sqliteTable(
  'work_translations',
  {
    id: text('id').primaryKey(),
    workId: text('work_id')
      .notNull()
      .references(() => works.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(), // ISO Code
    title: text('title').notNull(),
    titlePrefix: text('title_prefix'),
    titleContent: text('title_content'),
    titleNickname: text('title_nickname'),
    nicknames: text('nicknames', { mode: 'json' }).default('[]').notNull().$type<string[]>(),
    compositionPeriod: text('composition_period'),
    description: text('description'),

    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    lookupIdx: uniqueIndex('idx_work_trans_lookup').on(table.workId, table.lang),
    titleIdx: index('idx_work_trans_title').on(table.lang, table.title),
  }),
);

// --- Work Parts Table ---
export const workParts = sqliteTable(
  'work_parts',
  {
    id: text('id').primaryKey(),
    workId: text('work_id')
      .notNull()
      .references(() => works.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    catalogues: text('catalogues', { mode: 'json' }).default('[]').notNull().$type<Catalogue[]>(),
    // 'movement', 'number', 'act', 'scene', 'variation', 'section', 'part', 'interlude', 'supplement'
    type: text('type').notNull(),
    isNameStandard: integer('is_name_standard', { mode: 'boolean' }).default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    performanceDifficulty: integer('performance_difficulty'),
    keyTonality: text('key_tonality'),
    tempoText: text('tempo_text'),
    tsNumerator: integer('ts_numerator'),
    tsDenominator: integer('ts_denominator'),
    tsDisplayString: text('ts_display_string'),
    bpm: integer('bpm'),
    metronomeUnit: text('metronome_unit'),
    impressionDimensions: text('impression_dimensions', {
      mode: 'json',
    }).$type<ImpressionDimensions>(),
    genres: text('genres', { mode: 'json' }).default('[]').notNull().$type<MusicalGenre[]>(),
    nicknames: text('nicknames', { mode: 'json' }).default('[]').notNull().$type<string[]>(),
    basedOn: text('based_on', { mode: 'json' }).$type<BasedOn>(),

    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    workIdx: index('idx_work_parts_fk').on(table.workId),
    orderIdx: index('idx_work_parts_ord').on(table.workId, table.sortOrder),
    slugIdx: uniqueIndex('idx_work_parts_slg').on(table.workId, table.slug),
  }),
);

// --- Work Part Translations Table ---
export const workPartTranslations = sqliteTable(
  'work_part_translations',
  {
    id: text('id').primaryKey(),
    workPartId: text('work_part_id')
      .notNull()
      .references(() => workParts.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(), // ISO Code
    title: text('title').notNull(),
    titlePrefix: text('title_prefix'),
    titleContent: text('title_content'),
    titleNickname: text('title_nickname'),
    tempoTranslation: text('tempo_translation'),
    description: text('description'),

    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    lookupIdx: uniqueIndex('idx_work_part_trans_lookup').on(table.workPartId, table.lang),
  }),
);
