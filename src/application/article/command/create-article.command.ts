import { z } from 'zod';
import { ArticleMetadataSchema } from '@/domain/article/article.metadata';
import { ArticleControlSchema } from '@/domain/article/article.control';
import { ArticleContentSchema } from '@/domain/article/article.content';

/**
 * Create Article Command
 * 記事新規作成用のバリデーションスキーマ。
 */
export const CreateArticleCommandSchema = z.object({
  slug: ArticleMetadataSchema.shape.slug,
  lang: ArticleControlSchema.shape.lang,
  category: ArticleMetadataSchema.shape.category,
  title: ArticleMetadataSchema.shape.title,
  composerName: ArticleMetadataSchema.shape.composerName,
  content: (ArticleContentSchema.shape.body as z.ZodNullable<z.ZodString>).unwrap().min(1),
});

export type CreateArticleCommand = z.infer<typeof CreateArticleCommandSchema>;
