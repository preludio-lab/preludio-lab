'use client';

import { useId } from 'react';
import { NotationFormat } from '@/domain/score/score';
import { MusicalExample } from '@/domain/score/musical-example';
import { useScoreRenderer } from './useScoreRenderer';

interface ScoreProps {
  score: MusicalExample | { data: string; format: NotationFormat };
  className?: string; // 外部からのスタイリングを許可
}

/**
 * Score View Component
 * 音楽スコアをレンダリングする純粋なビューコンポーネントです。
 * 実際のレンダリングロジックは 'useScoreRenderer' フックを使用して処理します。
 */
export function ScoreComponent({ score, className }: ScoreProps) {
  const uniqueId = `score-${useId()}`;
  const { elementRef } = useScoreRenderer(score);

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
export { ScoreComponent as Score };
