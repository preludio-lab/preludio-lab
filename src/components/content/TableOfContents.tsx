'use client';

import React from 'react';

type TOCItem = {
  level: number;
  text: string;
  slug: string;
};

type Props = {
  items: TOCItem[];
  variant?: 'default' | 'minimal';
};

export const TableOfContents: React.FC<Props> = ({ items, variant = 'default' }) => {
  if (items.length === 0) return null;

  const containerClass = variant === 'default' ? 'toc p-4 bg-neutral-100 rounded-lg' : 'toc'; // Minimal has no extra styles

  return (
    <nav className={containerClass}>
      {variant === 'default' && (
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-3">
          Table of Contents
        </h2>
      )}
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.slug} style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}>
            <a
              href={`#${item.slug}`}
              className="block text-neutral-500 hover:text-accent transition-colors"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
