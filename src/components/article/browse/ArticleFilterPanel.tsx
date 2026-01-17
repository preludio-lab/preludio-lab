'use client';

import { useTranslations } from 'next-intl';
import { FilterState } from '@/hooks/useFilterState';
import { ArticleSortOption } from '@/domain/article/article.constants';
import { Input } from '@/components/ui/Input';
import { useDebouncedCallback } from 'use-debounce';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, m } from 'framer-motion';

interface ArticleFilterPanelProps {
  state: FilterState;
  onFilterChange: (key: keyof FilterState, value: string | string[] | undefined) => void;
  lang: string;
  totalCount: number;
}

/**
 * ArticleFilterPanel
 * 最新のArticleSortOptionに対応した、プレミアムで直感的なフィルタリングパネル。
 */
export function ArticleFilterPanel({ state, onFilterChange, totalCount }: ArticleFilterPanelProps) {
  const t = useTranslations('CategoryIndex');

  const difficulties = [
    { value: '1', label: t('difficulty.1') },
    { value: '2', label: t('difficulty.2') },
    { value: '3', label: t('difficulty.3') },
    { value: '4', label: t('difficulty.4') },
    { value: '5', label: t('difficulty.5') },
  ];

  const sorts = Object.values(ArticleSortOption);

  // デバウンスを有効にするための検索入力のローカル状態
  const [searchTerm, setSearchTerm] = useState(state.keyword || '');

  // ソートドロップダウンの状態
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // ローカル状態の同期
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setSearchTerm(state.keyword || '');
  }, [state.keyword]);

  // 外部クリックでソートドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const DEBOUNCE_DELAY_MS = 500;
  const debouncedFilterChange = useDebouncedCallback((value: string) => {
    onFilterChange('keyword', value || undefined);
  }, DEBOUNCE_DELAY_MS);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedFilterChange(value);
  };

  const showDifficulty = state.category === 'works' || state.category === 'theory';

  return (
    <div className="w-full mb-10 space-y-6 relative z-40">
      {/* メインコントロールバー */}
      <div className="relative z-50 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white/60 backdrop-blur-md rounded-3xl p-3 shadow-sm border border-neutral-200">
        {/* 左側: 検索入力 */}
        <div className="relative flex-grow max-w-full lg:max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-neutral-400 group-focus-within:text-primary transition-colors duration-300" />
          </div>
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-11 pr-10 py-3 w-full bg-neutral-100/50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary/50 rounded-full transition-all duration-300 placeholder:text-neutral-400 text-base text-primary"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                debouncedFilterChange('');
              }}
              className="absolute inset-y-0 right-3 flex items-center justify-center text-neutral-400 hover:text-primary transition-colors"
              aria-label="Clear search"
            >
              <XIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* 右側: コントロールと件数 */}
        <div className="flex flex-row items-center justify-between lg:justify-end gap-3 sm:gap-4">
          {/* カスタムソートドロップダウン */}
          <div className="relative w-full sm:w-auto min-w-[200px]" ref={sortRef}>
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={`w-full flex items-center justify-between bg-white border ${isSortOpen ? 'border-primary ring-2 ring-primary/10' : 'border-neutral-200 hover:border-accent/50'} py-3 pl-5 pr-4 rounded-full text-neutral-700 text-sm font-medium transition-all shadow-sm hover:shadow-md`}
            >
              <div className="flex items-center gap-2">
                <SortIcon className="w-4 h-4 text-neutral-400" />
                <span>{t(`sort.${state.sort || ArticleSortOption.PUBLISHED_AT}`)}</span>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isSortOpen && (
                <m.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-full sm:w-64 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-neutral-100/50 overflow-hidden z-50 p-1.5"
                >
                  {sorts.map((sort) => {
                    const isActive = (state.sort || ArticleSortOption.PUBLISHED_AT) === sort;
                    return (
                      <button
                        key={sort}
                        onClick={() => {
                          onFilterChange('sort', sort);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center justify-between ${
                          isActive
                            ? 'bg-primary/5 text-primary'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <SortIcon
                            className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-neutral-400'}`}
                          />
                          {t(`sort.${sort}`)}
                        </div>
                        {isActive && <CheckIcon className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </m.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 bg-neutral-50 text-neutral-400 rounded-full text-xs font-semibold tracking-wide border border-neutral-100/50">
            <span className="text-primary text-sm font-bold table-nums">{totalCount}</span>
            <span className="text-[10px] tracking-wider font-medium">Items</span>
          </div>
        </div>
      </div>

      {/* サブフィルタ: 難易度 */}
      {showDifficulty && (
        <div className="flex items-center gap-3 px-2 animate-fade-in-up overflow-x-auto pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <span className="text-sm font-bold text-neutral-400 mr-2 uppercase tracking-wider text-[11px] whitespace-nowrap hidden sm:inline-block">
            {t('filter.difficulty')}
          </span>

          <div className="flex items-center gap-3 flex-nowrap sm:flex-wrap">
            <button
              onClick={() => onFilterChange('difficulty', undefined)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 transform whitespace-nowrap flex-shrink-0 ${
                !state.difficulty
                  ? 'bg-primary text-paper shadow-lg shadow-primary/20 scale-105'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-transparent hover:scale-105'
              }`}
            >
              {t('filter.all')}
            </button>

            {difficulties.map((diff) => {
              const isSelected = state.difficulty === diff.value;
              return (
                <button
                  key={diff.value}
                  onClick={() => onFilterChange('difficulty', isSelected ? undefined : diff.value)}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 transform whitespace-nowrap flex-shrink-0 shadow-sm ${
                    isSelected
                      ? `bg-primary text-white shadow-md scale-105`
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 hover:scale-105'
                  }`}
                >
                  {diff.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function SortIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 4 4 4-4" />
      <path d="M7 4v16" />
      <path d="M11 4h10" />
      <path d="M11 8h7" />
      <path d="M11 12h4" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
