import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { MultilingualString } from '@/domain/i18n/Locale';

// --- Tags Table ---
export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    category: text('category').notNull(), // 'mood', 'situation', 'terminology'
    slug: text('slug').notNull(),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('idx_tags_slug').on(table.category, table.slug),
  }),
);

// --- Tag Translations Table ---
export const tagTranslations = sqliteTable(
  'tag_translations',
  {
    id: text('id').primaryKey(),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(),
    name: text('name').notNull(),
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    lookupIdx: uniqueIndex('idx_tag_trans_lookup').on(table.tagId, table.lang),
  }),
);

// --- Media Assets Table ---
export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(), // UUID v7
  mediaType: text('media_type').notNull(), // 'image', 'document', 'audio', 'video', 'json'
  url: text('url').notNull(), // Public URL
  altText: text('alt_text', { mode: 'json' }).default('{}').$type<MultilingualString>(),
  metadata: text('metadata', { mode: 'json' }).default('{}').notNull(), // JSON for size etc.
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});
