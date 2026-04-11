import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql, InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { works } from './works';
import { workParts } from './works';
import { scores } from './scores';

/**
 * Phrases Table
 * 楽曲内の特定のフレーズ（抜粋）を管理する
 */
export const phrases = sqliteTable('phrases', {
  id: text('id').primaryKey(), // UUID
  slug: text('slug').notNull().unique(), // URLフレンドリーな識別子
  workId: text('work_id')
    .notNull()
    .references(() => works.id),
  workPartId: text('work_part_id').references(() => workParts.id),
  scoreId: text('score_id').references(() => scores.id),

  // メタデータ
  format: text('format').notNull().default('abc'), // abc, musicxml, etc.
  dataStoragePath: text('data_storage_path'), // R2パスなど

  // 構造データ (JSON文字列として保存)
  measureRange: text('measure_range'), // { start: number, end: number, ... }
  recordingSegments: text('recording_segments'), // [{ recordingId: string, start: number, end: number }]

  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type Phrase = InferSelectModel<typeof phrases>;
export type NewPhrase = InferInsertModel<typeof phrases>;

/**
 * Phrase Translations Table
 * フレーズの多言語情報を管理する（キャプションなど）
 */
export const phraseTranslations = sqliteTable(
  'phrase_translations',
  {
    phraseId: text('phrase_id')
      .notNull()
      .references(() => phrases.id, { onDelete: 'cascade' }),
    lang: text('lang').notNull(), // ja, en, etc.
    caption: text('caption'), // フレーズの説明文
    createdAt: text('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: text('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.phraseId, table.lang] }),
    };
  },
);

export type PhraseTranslation = InferSelectModel<typeof phraseTranslations>;
export type NewPhraseTranslation = InferInsertModel<typeof phraseTranslations>;
