'use client';

import { Skeleton } from '@/components/ui/Skeleton';

interface SkeletonGridProps {
  count?: number;
}

/**
 * コンテンツ読み込み中に表示するスケルトンカードのグリッド。
 */
export function SkeletonGrid({ count = 6 }: SkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          {/* カード画像エリア */}
          <Skeleton className="aspect-video w-full rounded-xl" />

          <div className="space-y-2 px-1">
            {/* メタデータ (カテゴリ/日付) */}
            <Skeleton className="h-4 w-1/3" />

            {/* タイトル */}
            <Skeleton className="h-6 w-full" />

            {/* 説明文の行 */}
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
