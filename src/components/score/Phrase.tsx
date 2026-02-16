'use client';

import { useId } from 'react';
import { NotationFormat } from '@/domain/score/score';
import { Phrase } from '@/domain/score/phrase';
import { usePhraseRenderer } from './usePhraseRenderer';

interface PhraseProps {
  phrase: Phrase | { data: string; format: NotationFormat };
  className?: string; // 外部からのスタイリングを許可
}

/**
 * Phrase View Component
 * 音楽フレーズをレンダリングする純粋なビューコンポーネントです。
 * 実際のレンダリングロジックは 'usePhraseRenderer' フックを使用して処理します。
 */
export function PhraseComponent({ phrase, className }: PhraseProps) {
  const uniqueId = `phrase-${useId()}`;
  const { elementRef } = usePhraseRenderer(phrase);

  return (
    <div className={`w-full overflow-hidden ${className || ''}`}>
      <div
        id={uniqueId}
        ref={elementRef}
        className="w-full bg-white [&_.abcjs-staff]:fill-current [&_.abcjs-note]:fill-current"
      />
    </div>
  );
}

// ガイドラインに従い Named Export を使用
export { PhraseComponent as Phrase };
