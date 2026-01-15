import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { works, workParts } from './works';
import type { MultilingualString } from '@/domain/i18n/Locale';

// --- Recordings Table ---
export const recordings = sqliteTable(
    'recordings',
    {
        id: text('id').primaryKey(),
        workId: text('work_id')
            .notNull()
            .references(() => works.id, { onDelete: 'cascade' }),
        workPartId: text('work_part_id').references(() => workParts.id), // Nullable
        performerName: text('performer_name', { mode: 'json' })
            .default('{}')
            .notNull()
            .$type<MultilingualString>(),
        recordingYear: integer('recording_year'),
        isRecommended: integer('is_recommended', { mode: 'boolean' }).default(false).notNull(),

        createdAt: text('created_at')
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: text('updated_at')
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (table) => ({
        workIdx: index('idx_recordings_work_id').on(table.workId),
        partIdx: index('idx_recordings_part_id').on(table.workPartId),
        recIdx: index('idx_recordings_rec').on(table.workId, table.isRecommended),
    }),
);

// --- Recording Sources Table ---
export const recordingSources = sqliteTable(
    'recording_sources',
    {
        id: text('id').primaryKey(),
        recordingId: text('recording_id')
            .notNull()
            .references(() => recordings.id, { onDelete: 'cascade' }),
        provider: text('provider').notNull(), // 'youtube', 'spotify'
        externalSourceId: text('external_source_id').notNull(), // e.g. YouTube Video ID
        quality: text('quality'), // e.g. 'hd720'

        createdAt: text('created_at')
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: text('updated_at')
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (table) => ({
        recIdIdx: index('idx_rec_src_rec_id').on(table.recordingId),
        lookupIdx: index('idx_rec_src_lookup').on(table.provider, table.externalSourceId),
    }),
);
