import { sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { libsqlVector } from './custom.types';
import type { Place, ComposerImpressionDimensions } from '@/domain/shared/common.metadata';

// --- Composers Table ---
export const composers = sqliteTable(
  'composers',
  {
    id: text('id').primaryKey(), // UUID v7
    slug: text('slug').notNull(),
    era: text('era'), // MusicalEra ID
    birthDate: text('birth_date'), // ISO8601 or NULL
    deathDate: text('death_date'), // ISO8601 or NULL
    nationalityCode: text('nationality_code'), // ISO 3166-1 alpha-2

    // JSON Columns
    representativeInstruments: text('representative_instruments', { mode: 'json' })
      .default('[]')
      .notNull()
      .$type<string[]>(),
    representativeGenres: text('representative_genres', { mode: 'json' })
      .default('[]')
      .notNull()
      .$type<string[]>(),
    places: text('places', { mode: 'json' }).default('[]').notNull().$type<Place[]>(),
    impressionDimensions: text('impression_dimensions', {
      mode: 'json',
    }).$type<ComposerImpressionDimensions>(),
    tags: text('tags', { mode: 'json' }).default('[]').notNull().$type<string[]>(),

    portraitImagePath: text('portrait_image_path'),

    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('idx_composers_slug').on(table.slug),
  }),
);

// --- Composer Translations Table ---
export const composerTranslations = sqliteTable(
  'composer_translations',
  {
    id: text('id').primaryKey(),
    composerId: text('composer_id')
      .notNull()
      .references(() => composers.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(),
    fullName: text('full_name').notNull(),
    displayName: text('display_name').notNull(),
    shortName: text('short_name').notNull(),
    biography: text('biography'),

    // Vector Embedding
    profileEmbedding: libsqlVector(384)('profile_embedding'),

    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    lookupIdx: uniqueIndex('idx_comp_trans_lookup').on(table.composerId, table.lang),
    nameIdx: index('idx_comp_trans_name').on(table.lang, table.displayName),
    // Embedding index is usually managed outside Drizzle DDL or via raw SQL,
    // but can be defined here if library supports it. For now leaving it as column.
  }),
);
