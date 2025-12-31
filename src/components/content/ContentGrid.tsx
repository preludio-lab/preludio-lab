import React from 'react';

export interface ContentGridProps {
  children: React.ReactNode;
  maxColumns?: number;
}

/**
 * コンテンツカードを並べるための汎用レイアウトグリッド
 */
export function ContentGrid({ children, maxColumns = 2 }: ContentGridProps) {
  // 列数に応じたTailwindクラスの決定
  const gridColsClass = maxColumns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2';

  return <div className={`mx-auto grid max-w-4xl gap-6 ${gridColsClass}`}>{children}</div>;
}
