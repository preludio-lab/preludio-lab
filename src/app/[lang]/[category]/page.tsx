import { FsContentRepository } from '@/infrastructure/content/FsContentRepository';
import { GetCategoryContentsUseCase } from '@/application/content/GetCategoryContentsUseCase';
import { CategoryIndexFeature } from '@/components/content/CategoryIndexFeature';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SUPPORTED_CATEGORIES } from '@/domain/content/ContentConstants';
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

/**
 * 全てのカテゴリ一覧ページのための動的ルート。
 * URLパラメータに基づいてコンテンツの概要を取得し、CategoryIndexFeature をレンダリングします。
 */
export default async function CategoryPage({ params, searchParams }: Props) {
  const { lang, category } = await params;
  const { difficulty, keyword, sort, tags } = await searchParams;

  // カテゴリの有効性を検証
  if (!SUPPORTED_CATEGORIES.includes(category as any)) {
    notFound();
  }

  const repository = new FsContentRepository();
  const useCase = new GetCategoryContentsUseCase(repository);

  const contents = await useCase.execute({
    lang,
    category,
    difficulty,
    keyword,
    sort: sort as any,
    tags: tags ? tags.split(',') : undefined,
  });

  return <CategoryIndexFeature lang={lang} category={category} contents={contents} />;
}

/**
 * カテゴリページのメタデータを生成。
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'CategoryIndex' });

  const categoryName = t(`categories.${category}`);
  const title = t('title', { category: categoryName });

  // SEO: このカテゴリページ固有のalternates（canonicalとhreflang）を動的に生成
  const languages: Record<string, string> = {};
  supportedLocales.forEach((locale) => {
    languages[locale] = `/${locale}/${category}`;
  });
  // x-defaultは英語版を指す
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
