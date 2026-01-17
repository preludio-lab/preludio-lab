'use strict';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ArticleSortOption } from '@/domain/article/article.constants';
import { handleClientError } from '@/lib/client-error';

export type FilterState = {
  difficulty?: string;
  keyword?: string;
  sort?: string;
  tags?: string[];
  category?: string;
};

/**
 * Hook to manage filter state synchronized with URL query parameters.
 * Used in the CategoryIndex feature for filtering and sorting content.
 */
export function useFilterState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract state from current URL search params
  const state = useMemo((): FilterState => {
    return {
      difficulty: searchParams.get('difficulty') || undefined,
      keyword: searchParams.get('keyword') || undefined,
      sort: searchParams.get('sort') || ArticleSortOption.PUBLISHED_AT,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    };
  }, [searchParams]);

  /**
   * Updates a specific filter and pushes the new URL.
   */
  const setFilter = useCallback(
    (key: keyof FilterState, value: string | string[] | undefined) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, value);
        }
      }

      // Reset to page 1 if we had pagination (not yet implemented but good practice)
      // params.delete('page');

      const queryString = params.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

      try {
        router.push(nextUrl, { scroll: false });
      } catch (error) {
        handleClientError(error, undefined, 'useFilterState:setFilter');
      }
    },
    [router, pathname, searchParams],
  );

  /**
   * Clears all filters and returns to the base category URL.
   */
  const clearFilters = useCallback(() => {
    try {
      router.push(pathname, { scroll: false });
    } catch (error) {
      handleClientError(error, undefined, 'useFilterState:clearFilters');
    }
  }, [router, pathname]);

  return {
    state: { ...state, category: pathname.split('/').filter(Boolean).pop() }, // Robust extraction of category from path
    setFilter,
    clearFilters,
  };
}
