import { z } from 'zod';
import { ArticleControlSchema } from './article.control';
import { ArticleMetadataSchema } from './article.metadata';
import { ArticleContentSchema } from './article.content';
import { ArticleContextSchema } from './article.context';
import { EngagementMetricsSchema } from './article.engagement';

/**
 * Article Entity Schema
 * 記事エンティティの完全なスキーマ定義。
 * ドメイン層における「記事」の構造とバリデーションルールの正本（Master）。
 */
export const ArticleSchema = z.object({
  control: ArticleControlSchema,
  metadata: ArticleMetadataSchema,
  content: ArticleContentSchema,
  context: ArticleContextSchema,
  engagement: EngagementMetricsSchema,
});

export type Article = z.infer<typeof ArticleSchema>;

/**
 * Article Summary Schema
 * 記事の一覧表示・検索結果などで使用される「記事サマリー」のドメイン定義。
 * 複数のモジュールから主要な属性を抽出し、フラットな構造で表現します。
 *
 * Note: Presentation層でのJSONシリアライズ(Date -> string)前の状態です。
 */
export const ArticleSummarySchema = ArticleControlSchema.pick({
  id: true,
  lang: true,
  status: true,
})
  .merge(
    ArticleMetadataSchema.pick({
      slug: true,
      category: true,
      title: true,
      displayTitle: true,
      composerName: true,
      workTitle: true,
      excerpt: true,
      readingTimeSeconds: true,
      isFeatured: true,
      readingLevel: true,
      performanceDifficulty: true,
      playback: true,
      thumbnail: true,
      tags: true,
      publishedAt: true, // Keep as Date here
    }),
  )
  .merge(
    EngagementMetricsSchema.pick({
      viewCount: true,
      auditionCount: true,
      likeCount: true,
      resonanceCount: true,
      shareCount: true,
    }),
  );

export type ArticleSummary = z.infer<typeof ArticleSummarySchema>;
