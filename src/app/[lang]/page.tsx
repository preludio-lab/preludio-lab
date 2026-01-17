import Link from 'next/link';
import { LOCALES } from '@/lib/constants';
import { getTranslations } from 'next-intl/server';
import { articleRepository } from '@/infrastructure/article';
import { ListArticlesUseCase } from '@/application/article/usecase/list-articles.use-case';
import { ArticleFeaturedFeature } from '@/components/article/browse/ArticleFeaturedFeature';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleSortOption, SortDirection } from '@/domain/article/article.constants';
import { ArticleMetadataDto } from '@/application/article/dto/article.dto';

// ホーム画面のDiscoverセクションに表示するカテゴリ
const HOME_DISPLAY_CATEGORIES: ArticleCategory[] = [
  ArticleCategory.WORKS,
  ArticleCategory.COMPOSERS,
  ArticleCategory.THEORY,
  ArticleCategory.ERAS,
];

// 静的生成（SSG）のためのパラメータを明示的に定義
export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// ISR: 1日 (86400秒) キャッシュ
export const revalidate = 86400;

/**
 * Home Page
 * 最新の ArticleFeaturedSection を使用するように更新。
 */
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const t = await getTranslations('Home');
  const lang = (await params).lang;

  // UseCaseの実行
  let featuredArticles: ArticleMetadataDto[] = [];
  try {
    const listUseCase = new ListArticlesUseCase(articleRepository);
    const response = await listUseCase.execute({
      filter: {
        lang,
        isFeatured: true,
      },
      sort: {
        field: ArticleSortOption.PUBLISHED_AT,
        direction: SortDirection.DESC,
      },
      pagination: {
        limit: 5,
        offset: 0,
      },
    });
    featuredArticles = response.items;
  } catch (error) {
    const { handleError } = await import('@/lib/error');
    handleError(error, 'Home:GetFeaturedArticles');
  }

  const categoryColors: Partial<Record<ArticleCategory, string>> = {
    [ArticleCategory.WORKS]: 'bg-blue-50 text-blue-700',
    [ArticleCategory.COMPOSERS]: 'bg-amber-50 text-amber-700',
    [ArticleCategory.THEORY]: 'bg-purple-50 text-purple-700',
    [ArticleCategory.ERAS]: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="w-full bg-paper-white py-24 text-center">
        <div className="container mx-auto px-4">
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-preludio-black sm:text-6xl font-serif">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 leading-relaxed font-medium">
            {t('hero.description')}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href={`/${lang}/works`}
              className="rounded-full bg-preludio-black px-8 py-3 text-sm font-bold text-paper-white shadow-lg transition hover:bg-gray-800 transform hover:-translate-y-0.5"
            >
              {t('hero.explore')}
            </Link>
            <Link
              href={`/${lang}/about`}
              className="rounded-full bg-white px-8 py-3 text-sm font-bold text-preludio-black shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50 transform hover:-translate-y-0.5"
            >
              {t('hero.about')}
            </Link>
          </div>
        </div>
      </section>

      {/* Categories (Discover) */}
      <section className="container mx-auto py-20 px-4">
        <h2 className="mb-12 text-center text-3xl font-bold text-preludio-black font-serif uppercase tracking-widest">
          {t('discover')}
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_DISPLAY_CATEGORIES.map((catId) => (
            <Link
              key={catId}
              href={`/${lang}/${catId}`}
              className={`group relative block overflow-hidden rounded-3xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-neutral-100 ${categoryColors[catId] ?? 'bg-gray-50 text-gray-700'}`}
            >
              <h3 className="mb-2 text-xl font-bold font-serif">{t(`categories.${catId}.name`)}</h3>
              <p className="text-sm opacity-80 font-medium leading-relaxed">
                {t(`categories.${catId}.desc`)}
              </p>
              <div className="mt-4 flex items-center text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Explore &rarr;
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Article */}
      <ArticleFeaturedFeature contents={featuredArticles} />
    </div>
  );
}
