import React from 'react';

export interface ArticleGridProps {
  children: React.ReactNode;
  maxColumns?: number;
}

/**
 * 記事カードを並べるためのレイアウトグリッド
 */
export function ArticleGrid({ children, maxColumns = 2 }: ArticleGridProps) {
  // 列数に応じたTailwindクラスの決定
  const gridColsClass = maxColumns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2';

  return <div className={`mx-auto grid max-w-4xl gap-6 ${gridColsClass}`}>{children}</div>;
}
