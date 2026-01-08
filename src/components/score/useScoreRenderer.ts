import { useEffect, useRef } from 'react';
import { Score, ScoreFormatType } from '@/domain/score/Score';
import { MusicalExample } from '@/domain/score/MusicalExample';
import { AbcjsScoreRenderer } from '@/infrastructure/score/AbcjsScoreRenderer';
import { handleClientError } from '@/lib/client-error';

/**
 * useScoreRenderer
 * スコアレンダリングロジックを扱うカスタムフックです。
 * レンダラーのライフサイクルとDOM要素を管理します。
 */
export function useScoreRenderer(score: Score | MusicalExample | { data: string; format: ScoreFormatType }) {
  const elementRef = useRef<HTMLDivElement>(null);

  // 依存性の注入 (簡易版)
  // レンダラーをメモ化し、レンダリング間で参照を安定させます
  const renderer = useRef(new AbcjsScoreRenderer()).current;

  useEffect(() => {
    let isMounted = true;

    const renderScore = async () => {
      if (!elementRef.current || !score) return;

      const data = 'metadata' in score && 'data' in score.metadata ? score.metadata.data : (score as any).data;
      const format = 'metadata' in score && 'format' in score.metadata ? score.metadata.format : (score as any).format;

      try {
        if (process.env.NODE_ENV === 'development') {
          console.debug('useScoreRenderer: レンダリングを開始しました', { format });
        }

        await renderer.render(data, elementRef.current, format);

        if (isMounted && process.env.NODE_ENV === 'development') {
          console.debug('useScoreRenderer: レンダリングが完了しました');
        }
      } catch (error) {
        if (isMounted) {
          handleClientError(error, 'スコアのレンダリングに失敗しました');
        }
      }
    };

    renderScore();

    return () => {
      isMounted = false;
    };
  }, [score, renderer]);

  return { elementRef };
}
