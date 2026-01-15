import { relations } from 'drizzle-orm';
import { articles, articleTranslations, series, seriesArticles } from './articles';

export const articlesRelations = relations(articles, ({ many, one }) => ({
    translations: many(articleTranslations),
    series: one(series, {
        fields: [articles.id],
        references: [series.articleId],
    }), // 1つの記事はシリーズの親(header)になりうる
    seriesMemberships: many(seriesArticles), // 1つの記事は複数のシリーズに所属しうる
}));

export const articleTranslationsRelations = relations(articleTranslations, ({ one }) => ({
    article: one(articles, {
        fields: [articleTranslations.articleId],
        references: [articles.id],
    }),
}));

export const seriesRelations = relations(series, ({ one, many }) => ({
    article: one(articles, {
        fields: [series.articleId],
        references: [articles.id],
    }),
    items: many(seriesArticles),
}));

export const seriesArticlesRelations = relations(seriesArticles, ({ one }) => ({
    series: one(series, {
        fields: [seriesArticles.seriesId],
        references: [series.id],
    }),
    article: one(articles, {
        fields: [seriesArticles.articleId],
        references: [articles.id],
    }),
}));
