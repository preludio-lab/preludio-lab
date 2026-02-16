'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { NotationFormat } from '@/domain/score/score';
import { Phrase } from '@/domain/score/phrase';

const PhraseView = dynamic(() => import('./Phrase').then((mod) => mod.Phrase), {
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

export interface PhraseRendererProps {
  phrase: Phrase | { data: string; format: NotationFormat };
  className?: string;
}

/**
 * PhraseRenderer
 * 純粋に楽譜(フレーズ)をレンダリングするコンポーネントです。
 * 再生機能や他の外部ドメインには依存せず、Phraseドメインのデータのみを表示します。
 */
export function PhraseRenderer({ phrase }: PhraseRendererProps) {
  return (
    <div className="relative group phrase-wrapper mt-0">
      <PhraseView phrase={phrase} />
    </div>
  );
}
