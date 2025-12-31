import Link from 'next/link';
import { LOCALES } from '@/lib/constants';
import { getTranslations } from 'next-intl/server';
import { FsContentRepository } from '@/infrastructure/content/FsContentRepository';
import { GetFeaturedContentUseCase } from '@/application/content/GetFeaturedContentUseCase';
import { FeaturedSection } from '@/components/content/FeaturedSection';
import { ContentCategory } from '@/domain/content/ContentConstants';
import { ContentSummary } from '@/domain/content/Content';

// ホーム画面のDiscoverセクションに表示するカテゴリ
const HOME_DISPLAY_CATEGORIES: ContentCategory[] = ['works', 'composers', 'theory', 'eras'];

// 静的生成（SSG）のためのパラメータを明示的に定義
export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// ISR: 1日 (86400秒) キャッシュ
// 裏側での再計算はNext.jsが自動的に行う
export const revalidate = 86400;

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  // メモ: クライアントコンポーネントでは `useParams` や props を使用しますが、
  // サーバーコンポーネントでは `useTranslations` を直接使用できます。
  const t = await getTranslations('Home');
  const lang = (await params).lang;

  // UseCaseの実行
  let featuredContent: ContentSummary[] = [];
  try {
    const repository = new FsContentRepository();
    const getFeaturedContent = new GetFeaturedContentUseCase(repository);
    featuredContent = await getFeaturedContent.execute({ lang, criteria: 'latest' });
  } catch (error) {
    const { handleError } = await import('@/lib/error');
    handleError(error, 'Home:GetFeaturedContent');
  }

  // ホーム画面のDiscoverセクションに表示するカテゴリ
  // HOME_DISPLAY_CATEGORIES に基づいて表示
  const categoryColors: Partial<Record<ContentCategory, string>> = {
    [ContentCategory.WORKS]: 'bg-blue-50 text-blue-700',
    [ContentCategory.COMPOSERS]: 'bg-amber-50 text-amber-700',
    [ContentCategory.THEORY]: 'bg-purple-50 text-purple-700',
    [ContentCategory.ERAS]: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="w-full bg-paper-white py-24 text-center">
        <div className="container mx-auto px-4">
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-preludio-black sm:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600">{t('hero.description')}</p>
          <div className="flex justify-center gap-4">
            <Link
              href={`/${lang}/works`}
              className="rounded-full bg-preludio-black px-8 py-3 text-sm font-semibold text-paper-white shadow-lg transition hover:bg-gray-800"
            >
              {t('hero.explore')}
            </Link>
            <Link
              href={`/${lang}/about`}
              className="rounded-full bg-paper-white px-8 py-3 text-sm font-semibold text-preludio-black shadow-sm ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50"
            >
              {t('hero.about')}
            </Link>
          </div>
        </div>
      </section>

      {/* Categories (Discover) */}
      <section className="container mx-auto py-20 px-4">
        <h2 className="mb-12 text-center text-3xl font-bold text-preludio-black">
          {t('discover')}
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_DISPLAY_CATEGORIES.map((catId) => (
            <Link
              key={catId}
              href={`/${lang}/${catId}`}
              className={`group relative block overflow-hidden rounded-2xl p-8 transition hover:shadow-md ${categoryColors[catId] ?? 'bg-gray-50 text-gray-700'}`}
            >
              <h3 className="mb-2 text-xl font-bold">{t(`categories.${catId}.name`)}</h3>
              <p className="text-sm opacity-80">{t(`categories.${catId}.desc`)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Article */}
      <FeaturedSection contents={featuredContent} />
    </div>
  );
}
