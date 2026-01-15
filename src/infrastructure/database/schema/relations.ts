import { relations } from 'drizzle-orm';
import { articles, articleTranslations, series, seriesArticles } from './articles';
import { composers, composerTranslations } from './composers';
import { works, workTranslations, workParts } from './works';
import { scores, scoreTranslations, scoreWorks, musicalExamples } from './scores';
import { recordings, recordingSources } from './recordings';
import { tags, tagTranslations } from './common';

// --- Articles Relations (記事ドメイン) ---
export const articlesRelations = relations(articles, ({ many, one }) => ({
  // 記事の翻訳データ (1:N) - 言語ごとのコンテンツ
  translations: many(articleTranslations),
  // 記事が「シリーズの親 (Header)」である場合のリレーション (1:1)
  series: one(series, {
    fields: [articles.id],
    references: [series.articleId],
  }),
  // 記事が「シリーズの子」として所属する場合のリレーション (1:N)
  seriesMemberships: many(seriesArticles),
  // 記事が特定の「作品」についてのものである場合のリレーション (N:1, Optional)
  work: one(works, {
    fields: [articles.workId],
    references: [works.id],
  }),
}));

export const articleTranslationsRelations = relations(articleTranslations, ({ one }) => ({
  // 所属元の記事 (N:1)
  article: one(articles, {
    fields: [articleTranslations.articleId],
    references: [articles.id],
  }),
}));

export const seriesRelations = relations(series, ({ one, many }) => ({
  // シリーズの顔となる記事 (1:1)
  article: one(articles, {
    fields: [series.articleId],
    references: [articles.id],
  }),
  // シリーズに含まれる子記事のリスト (1:N)
  items: many(seriesArticles),
}));

export const seriesArticlesRelations = relations(seriesArticles, ({ one }) => ({
  // 所属先のシリーズ (N:1)
  series: one(series, {
    fields: [seriesArticles.seriesId],
    references: [series.id],
  }),
  // シリーズに含まれる記事 (N:1)
  article: one(articles, {
    fields: [seriesArticles.articleId],
    references: [articles.id],
  }),
}));

// --- Composers Relations (作曲家ドメイン) ---
export const composersRelations = relations(composers, ({ many }) => ({
  // 作曲家の翻訳データ (1:N)
  translations: many(composerTranslations),
  // 作曲した作品リスト (1:N)
  works: many(works),
}));

export const composerTranslationsRelations = relations(composerTranslations, ({ one }) => ({
  // 所属元の作曲家 (N:1)
  composer: one(composers, {
    fields: [composerTranslations.composerId],
    references: [composers.id],
  }),
}));

// --- Works Relations (作品ドメイン) ---
export const worksRelations = relations(works, ({ one, many }) => ({
  // 作曲家 (N:1)
  composer: one(composers, {
    fields: [works.composerId],
    references: [composers.id],
  }),
  // 作品の翻訳データ (1:N)
  translations: many(workTranslations),
  // 楽章・構成パーツ (1:N)
  parts: many(workParts),
  // この作品に関連する記事 (1:N)
  articles: many(articles),
  // 収録されている楽譜エディション (N:Nの中間テーブル)
  scoreWorks: many(scoreWorks),
  // この作品の譜例 (1:N)
  musicalExamples: many(musicalExamples),
  // この作品の録音 (1:N)
  recordings: many(recordings),
}));

export const workTranslationsRelations = relations(workTranslations, ({ one }) => ({
  work: one(works, {
    fields: [workTranslations.workId],
    references: [works.id],
  }),
}));

export const workPartsRelations = relations(workParts, ({ one, many }) => ({
  // 所属元の作品 (N:1)
  work: one(works, {
    fields: [workParts.workId],
    references: [works.id],
  }),
  // 特定の楽章に紐づく譜例 (1:N)
  musicalExamples: many(musicalExamples),
  // 特定の楽章に紐づく録音 (1:N)
  recordings: many(recordings),
}));

// --- Scores Relations (楽譜/アセットドメイン) ---
export const scoresRelations = relations(scores, ({ many }) => ({
  // 楽譜情報の翻訳データ (1:N)
  translations: many(scoreTranslations),
  // 収録作品マッピング (N:N)
  scoreWorks: many(scoreWorks),
  // この楽譜を出典とする譜例 (1:N)
  musicalExamples: many(musicalExamples),
}));

export const scoreTranslationsRelations = relations(scoreTranslations, ({ one }) => ({
  score: one(scores, {
    fields: [scoreTranslations.scoreId],
    references: [scores.id],
  }),
}));

export const scoreWorksRelations = relations(scoreWorks, ({ one }) => ({
  // 収録先の楽譜
  score: one(scores, {
    fields: [scoreWorks.scoreId],
    references: [scores.id],
  }),
  // 収録されている作品
  work: one(works, {
    fields: [scoreWorks.workId],
    references: [works.id],
  }),
}));

export const musicalExamplesRelations = relations(musicalExamples, ({ one }) => ({
  // どの作品の譜例か (N:1)
  work: one(works, {
    fields: [musicalExamples.workId],
    references: [works.id],
  }),
  // どの楽章の譜例か (N:1, Optional)
  workPart: one(workParts, {
    fields: [musicalExamples.workPartId],
    references: [workParts.id],
  }),
  // 出典元の楽譜エディション (N:1, Optional)
  score: one(scores, {
    fields: [musicalExamples.scoreId],
    references: [scores.id],
  }),
}));

// --- Recordings Relations (録音/アセットドメイン) ---
export const recordingsRelations = relations(recordings, ({ one, many }) => ({
  // どの作品の録音か (N:1)
  work: one(works, {
    fields: [recordings.workId],
    references: [works.id],
  }),
  // どの楽章の録音か (N:1, Optional)
  workPart: one(workParts, {
    fields: [recordings.workPartId],
    references: [workParts.id],
  }),
  // 具体的な配信ソース (Spotify/YouTube等) (1:N)
  sources: many(recordingSources),
}));

export const recordingSourcesRelations = relations(recordingSources, ({ one }) => ({
  // 所属元の録音メタデータ (N:1)
  recording: one(recordings, {
    fields: [recordingSources.recordingId],
    references: [recordings.id],
  }),
}));

// --- Common Relations (共通ドメイン) ---
export const tagsRelations = relations(tags, ({ many }) => ({
  // タグの翻訳データ (1:N)
  translations: many(tagTranslations),
}));

export const tagTranslationsRelations = relations(tagTranslations, ({ one }) => ({
  tag: one(tags, {
    fields: [tagTranslations.tagId],
    references: [tags.id],
  }),
}));
