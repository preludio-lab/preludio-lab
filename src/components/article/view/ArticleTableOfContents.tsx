'use client';

import React from 'react';
import { ContentSection, ContentStructure } from '@/domain/article/article';

type Props = {
  items: ContentStructure;
  variant?: 'default' | 'minimal';
};

/**
 * ArticleTableOfContents
 * 最新のArticleドメインの ContentStructure (再帰的階層) に対応した目次コンポーネント。
 */
export const ArticleTableOfContents: React.FC<Props> = ({ items, variant = 'default' }) => {
  if (!items || items.length === 0) return null;

  const containerClass = variant === 'default' ? 'toc p-4 bg-neutral-100 rounded-lg' : 'toc';

  const renderItems = (sections: ContentSection[]) => {
    return sections.map((item) => (
      <React.Fragment key={item.id}>
        <li style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}>
          <a
            href={`#${item.id}`}
            className="block py-1 text-neutral-500 hover:text-accent transition-colors transition-all duration-200"
          >
            {item.heading}
          </a>
        </li>
        {item.children && item.children.length > 0 && renderItems(item.children)}
      </React.Fragment>
    ));
  };

  return (
    <nav className={containerClass}>
      {variant === 'default' && (
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-3">
          Table of Contents
        </h2>
      )}
      <ul className="space-y-1 text-sm">{renderItems(items)}</ul>
    </nav>
  );
};
