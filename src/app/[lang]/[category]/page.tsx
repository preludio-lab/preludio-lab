import { FsArticleRepository } from '@/infrastructure/article/FsArticleRepository';
import { ListArticlesUseCase } from '@/application/article/usecase/ListArticlesUseCase';
import { ArticleBrowseFeature } from '@/components/article/browse/ArticleBrowseFeature';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { ArticleSortOption } from '@/domain/article/ArticleConstants';
import { supportedLocales } from '@/domain/i18n/Locale';

type Props = {
  params: Promise<{
    lang: string;
    category: string;
  }>;
  searchParams: Promise<{
    difficulty?: string;
    keyword?: string;
    sort?: string;
    tags?: string;
  }>;
};

// Poor man's DI
const articleRepository = new FsArticleRepository();

/**
 * CategoryPage
 * 最新の ArticleCategoryIndexFeature を使用するように更新。
 */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { lang, category } = await params;
  const { sort, difficulty, keyword } = await searchParams;

  const validCategories = Object.values(ArticleCategory);
  if (!validCategories.includes(category as any)) {
    notFound();
  }

  const useCase = new ListArticlesUseCase(articleRepository);
  const criteriaSort = sort ? (sort as ArticleSortOption) : ArticleSortOption.PUBLISHED_AT;

  const response = await useCase.execute({
    lang,
    category: category as ArticleCategory,
    sortBy: criteriaSort,
    minReadingLevel: difficulty ? parseInt(difficulty) : undefined,
    maxReadingLevel: difficulty ? parseInt(difficulty) : undefined,
    // Note: FsArticleRepository currently filters by exact level if min/max are same
    limit: 100
  });

  return <ArticleBrowseFeature lang={lang} category={category} contents={response.items} />;
}

/**
 * generateMetadata
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'CategoryIndex' });

  const categoryName = t(`categories.${category}`);
  const title = t('title', { category: categoryName });

  const languages: Record<string, string> = {};
  supportedLocales.forEach((locale) => {
    languages[locale] = `/${locale}/${category}`;
  });
  languages['x-default'] = `/en/${category}`;

  return {
    title: `${title} | Preludio Lab`,
    description: `Explore all ${categoryName} content on Preludio Lab.`,
    alternates: {
      canonical: `/${lang}/${category}`,
      languages,
    },
  };
}
