import { ArticleRepository } from '@/domain/article/article.repository';
import { Article } from '@/domain/article/article';
import { AppLocale } from '@/domain/i18n/locale';
import { ArticleMetadata } from '@/domain/article/article.metadata';
import { ArticleStatus } from '@/domain/article/article.control';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { INITIAL_ENGAGEMENT_METRICS } from '@/domain/article/article.engagement';
import { ArticleContent } from '@/domain/article/article.content';

export interface CreateArticleCommand {
  slug: string;
  lang: string;
  category: ArticleCategory;
  title: string;
  composerName: string;
  content: string;
}

/**
 * CreateArticleUseCase
 * 新規記事作成
 */
export class CreateArticleUseCase {
  constructor(private readonly articleRepository: ArticleRepository) { }

  async execute(command: CreateArticleCommand): Promise<string> {
    // Check if exists
    const existing = await this.articleRepository.findBySlug(
      command.lang,
      command.category,
      command.slug,
    );
    if (existing) {
      throw new Error(`Article with slug ${command.slug} already exists.`);
    }

    // Default Metadata
    const metadata: ArticleMetadata = {
      title: command.title,
      displayTitle: command.title,
      composerName: command.composerName,
      tags: [],
      slug: command.slug,
      category: command.category,
      isFeatured: false,
      readingTimeSeconds: 0,
      publishedAt: null,
    };

    const article = new Article({
      control: {
        id: command.slug, // ID generation strategy (use slug for FS)
        lang: command.lang as AppLocale,
        status: ArticleStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      metadata,
      content: new ArticleContent({
        body: command.content,
        structure: [],
      }),
      engagement: {
        metrics: INITIAL_ENGAGEMENT_METRICS,
      },
    });

    await this.articleRepository.save(article);

    return article.id;
  }
}
