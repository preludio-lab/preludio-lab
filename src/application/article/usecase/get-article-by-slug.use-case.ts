import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleDto } from '@/application/article/dto/article.dto';
import { Article } from '@/domain/article/article';

import { ArticleCategory } from '@/domain/article/article-metadata';

/**
 * GetArticleBySlugUseCase
 * スラグ（URL）による単一記事の取得（詳細画面用）
 */
export class GetArticleBySlugUseCase {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(lang: string, category: string, slug: string): Promise<ArticleDto | null> {
    const article = await this.articleRepository.findBySlug(
      lang,
      category as ArticleCategory,
      slug,
    );

    if (!article) {
      return null;
    }

    return this.toDto(article);
  }

  private toDto(article: Article): ArticleDto {
    return {
      control: {
        id: article.control.id,
        lang: article.control.lang as any,
        status: article.control.status,
        createdAt: article.control.createdAt,
        updatedAt: article.control.updatedAt,
      },
      metadata: article.metadata,
      content: article.content,
      context: article.context,
      engagement: article.engagement.metrics,
    };
  }
}
