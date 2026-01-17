import { articleRepository } from '@/infrastructure/article';
import { ListArticlesUseCase } from '@/application/article/usecase/list-articles.use-case';
import { ArticleBrowseFeature } from '@/components/article/browse/ArticleBrowseFeature';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArticleCategory } from '@/domain/article/article-metadata';
import { ArticleSortOption, SortDirection } from '@/domain/article/article.constants';
import { supportedLocales } from '@/domain/i18n/locale';

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

// Repository Singleton は中央エントリポイントから提供されるインスタンスを使用します。

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
    filter: {
      lang,
      category: category as ArticleCategory,
      minReadingLevel: difficulty ? parseInt(difficulty) : undefined,
      maxReadingLevel: difficulty ? parseInt(difficulty) : undefined,
      keyword: keyword,
    },
    sort: {
      field: criteriaSort,
      direction: SortDirection.DESC, // Default to DESC
    },
    pagination: {
      limit: 100,
      offset: 0,
    },
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
