'use client';

import { ArticleMetadataDto } from '@/application/article/dto/ArticleDto';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useFilterState } from '@/hooks/useFilterState';
import { FadeInHeading } from '@/components/ui/FadeInHeading';
import { ArticleFilterPanel } from './ArticleFilterPanel';
import { ArticleCard } from './ArticleCard';
import { handleClientError } from '@/lib/client-error';

interface ArticleBrowseFeatureProps {
  lang: string;
  category: string;
  contents: ArticleMetadataDto[];
}

/**
 * ArticleBrowseFeature
 * 最新のArticleMetadataDtoに対応した、カテゴリ一覧ページのメイン機能。
 */
export function ArticleBrowseFeature({ lang, category, contents }: ArticleBrowseFeatureProps) {
  const t = useTranslations('CategoryIndex');
  const { state, setFilter: originalSetFilter } = useFilterState();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const setFilter = (key: any, value: any) => {
    startTransition(() => {
      originalSetFilter(key, value);
    });
  };

  return (
    <section className="min-h-screen pt-28 pb-20 px-4 md:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* 見出しエリア */}
        <header className="mb-10 text-center">
          <FadeInHeading className="text-4xl md:text-5xl font-black text-primary mb-2" priority>
            {t('title', { category: t(`categories.${category}`) })}
          </FadeInHeading>
        </header>

        {/* フィルタ & 検索コントロール */}
        <ArticleFilterPanel
          state={state}
          onFilterChange={setFilter}
          lang={lang}
          totalCount={contents.length}
        />

        {/* 結果グリッド */}
        <div
          className={`transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
        >
          {contents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {contents.map((content, idx) => (
                <ArticleCard
                  key={`${content.category}-${content.slug}`}
                  content={content}
                  readMoreLabel={t('readMore')}
                  index={idx}
                  priority={idx < 6}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white/40 backdrop-blur-md rounded-3xl border border-divider shadow-inner flex flex-col items-center justify-center">
              <div className="mb-6 w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center border border-divider">
                <SearchOffIcon className="w-10 h-10 text-tertiary/40" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">{t('emptyState')}</h3>
              <p className="text-tertiary text-sm mb-8 max-w-xs mx-auto">
                別のキーワードやフィルター条件で試してみてください。
              </p>
              <button
                onClick={() => {
                  try {
                    router.push(window.location.pathname);
                  } catch (e) {
                    handleClientError(e, undefined, 'ArticleBrowseFeature:Reset');
                  }
                }}
                className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary-dark transition-all transform hover:-translate-y-0.5 shadow-md"
              >
                {t('filter.all')}をリセット
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SearchOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 2 20 20" />
      <path d="M16.57 11a7 7 0 0 0-9.14-9.14" />
      <path d="M4.43 13a7 7 0 0 0 9.14 9.14" />
      <path d="M18.12 18.12 21 21" />
    </svg>
  );
}
