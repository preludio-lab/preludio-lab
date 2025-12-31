'use client';

import { useState } from 'react';
import Link from 'next/link';

type SearchResult = {
  id: string;
  data: {
    url: string;
    meta: {
      title: string;
      image?: string;
    };
    excerpt: string;
  };
};

export const SearchBox = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    // Supabase Hybrid Search will be implemented here.
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {/* Icon */}
        <div className="absolute right-3 top-2.5 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {results.map((result) => (
              <li key={result.id}>
                <Link
                  href={result.data.url}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {result.data.meta.title}
                  </div>
                  <div
                    className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: result.data.excerpt }}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
