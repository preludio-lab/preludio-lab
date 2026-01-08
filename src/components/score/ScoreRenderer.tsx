'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { Score, ScoreFormatType } from '@/domain/score/Score';
import { MusicalExample } from '@/domain/score/MusicalExample';

const ScoreView = dynamic(() => import('./Score').then((mod) => mod.Score), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  ),
});

export interface ScoreRendererProps {
  score: Score | MusicalExample | { data: string; format: ScoreFormatType };
  className?: string;
}

/**
 * ScoreRenderer
 * 純粋に楽譜をレンダリングするコンポーネントです。
 * 再生機能や他の外部ドメインには依存せず、Scoreドメインのデータのみを表示します。
 */
export function ScoreRenderer({ score }: ScoreRendererProps) {
  return (
    <div className="relative group score-wrapper mt-0">
      <ScoreView score={score} />
    </div>
  );
}
