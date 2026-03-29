'use client';

import React, { useState, useEffect, useRef } from 'react';
import { searchComposersAction } from '@/actions/work.action';
import type { ComposerSearchResult } from '@/application/composer/query/composer-search-query.interface';

interface ComposerTypeaheadProps {
  selectedId: string;
  selectedName: string;
  onSelect: (composer: ComposerSearchResult) => void;
  lang?: string;
}

export function ComposerTypeahead({
  selectedId,
  selectedName,
  onSelect,
  lang = 'ja',
}: ComposerTypeaheadProps) {
  const [query, setQuery] = useState(selectedName);
  const [results, setResults] = useState<ComposerSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update query if selectedName changes from outside
  useEffect(() => {
    setQuery(selectedName);
  }, [selectedName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 1 || !isOpen) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await searchComposersAction({ query, lang });
        if (response.success && response.data) {
          setResults(response.data);
        }
      } catch {
        // empty
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen, lang]);

  const handleSelect = (composer: ComposerSearchResult) => {
    setQuery(composer.displayName);
    onSelect(composer);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full bg-admin-sidebar-bg border border-admin-border rounded-md px-3 py-2 text-admin-text-primary focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm"
        placeholder="作曲家を検索..."
      />

      {isOpen && (query.length > 0 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-admin-card-bg border border-admin-border rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading && (
            <div className="px-4 py-2 text-sm text-admin-text-secondary">検索中...</div>
          )}
          {!isLoading && results.length === 0 && query.length > 0 && (
            <div className="px-4 py-2 text-sm text-admin-text-secondary">見つかりませんでした</div>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-admin-sidebar-bg transition-colors ${
                c.id === selectedId
                  ? 'bg-admin-primary/10 text-admin-primary'
                  : 'text-admin-text-primary'
              }`}
            >
              <div className="font-medium">{c.displayName}</div>
              <div className="text-xs text-admin-text-secondary">{c.slug}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
