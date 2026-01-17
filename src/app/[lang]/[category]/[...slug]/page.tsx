import { GetArticleBySlugUseCase } from '@/application/article/usecase/get-article-by-slug.use-case';
import { ListArticlesUseCase } from '@/application/article/usecase/list-articles.use-case';
import { articleRepository } from '@/infrastructure/article';
import { logger } from '@/infrastructure/logging';
import { ArticleViewFeature } from '@/components/article/view/ArticleViewFeature';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LOCALES } from '@/lib/constants';
import { supportedLocales } from '@/domain/i18n/locale';
import { ArticleStatus } from '@/domain/article/article.control';
import { ArticleSortOption, SortDirection } from '@/domain/article/article.constants';
import { ArticleDto, ArticleMetadataDto } from '@/application/article/dto/article.dto';

type Props = {
  params: Promise<{
    lang: string;
    category: string;
    slug: string[];
  }>;
};

// Repository Singleton は中央エントリポイントから提供されるインスタンスを使用します。

/**
 * generateStaticParams
 */
export async function generateStaticParams() {
  const useCase = new ListArticlesUseCase(articleRepository);
  const params: { lang: string; category: string; slug: string[] }[] = [];

  for (const lang of LOCALES) {
    try {
      const response = await useCase.execute({
        filter: { lang },
        pagination: { limit: 1000, offset: 0 },
      });

      for (const item of response.items) {
        params.push({
          lang,
          category: item.category,
          slug: [item.slug],
        });
      }
    } catch (e) {
      console.warn(`Failed to generate static params for ${lang}`, e);
    }
  }
  return params;
}

/**
 * ContentDetailPage
 * 最新の ArticleDetailFeature を使用するように更新。
 */
export default async function ContentDetailPage({ params }: Props) {
  const { lang, category, slug } = await params;
  const slugStr = Array.isArray(slug) ? slug.join('/') : slug;

  const getUseCase = new GetArticleBySlugUseCase(articleRepository);
  const listUseCase = new ListArticlesUseCase(articleRepository);

  let article: ArticleDto | null = null;
  let prevContent: ArticleMetadataDto | null = null;
  let nextContent: ArticleMetadataDto | null = null;

  try {
    article = await getUseCase.execute(lang, category, slugStr);

    if (article) {
      const summaryResponse = await listUseCase.execute({
        filter: {
          lang,
          category: article.metadata.category,
          status: [ArticleStatus.PUBLISHED],
        },
        pagination: {
          limit: 1000,
          offset: 0,
        },
        sort: {
          field: ArticleSortOption.TITLE,
          direction: SortDirection.ASC,
        },
      });

      const sorted = summaryResponse.items;
      const currentIndex = sorted.findIndex((c) => c.slug === article!.metadata.slug);
      if (currentIndex >= 0) {
        if (currentIndex > 0) prevContent = sorted[currentIndex - 1];
        if (currentIndex < sorted.length - 1) nextContent = sorted[currentIndex + 1];
      }
    }
  } catch (error) {
    logger.error('Error fetching content detail', error as Error, { lang, category, slugStr });
  }

  if (!article) {
    notFound();
  }

  return (
    <ArticleViewFeature article={article} prevContent={prevContent} nextContent={nextContent} />
  );
}

/**
 * generateMetadata
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category, slug } = await params;
  const slugStr = Array.isArray(slug) ? slug[slug.length - 1] : slug;

  const useCase = new GetArticleBySlugUseCase(articleRepository);
  const article = await useCase.execute(lang, category, slugStr);

  if (!article) return {};

  return {
    title: `${article.metadata.displayTitle} | Preludio Lab`,
    description:
      article.metadata.excerpt ||
      `Discover more about ${article.metadata.displayTitle} on Preludio Lab.`,
  };
}
