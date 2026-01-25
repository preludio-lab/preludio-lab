import { z } from 'zod';
import { ArticleCategory } from '@/domain/article/article.metadata';

/**
 * Create Article Command
 * 記事新規作成用のバリデーションスキーマ。
 */
export const CreateArticleCommandSchema = z.object({
  slug: z.string().min(1),
  lang: z.string().min(1),
  category: z.nativeEnum(ArticleCategory),
  title: z.string().min(1),
  composerName: z.string().min(1),
  content: z.string().min(1),
});

export type CreateArticleCommand = z.infer<typeof CreateArticleCommandSchema>;
