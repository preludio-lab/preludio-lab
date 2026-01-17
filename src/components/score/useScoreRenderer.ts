import { useEffect, useRef, useState } from 'react';
import { NotationFormat } from '@/domain/score/score';
import { MusicalExample } from '@/domain/score/musical-example';
import { AbcjsScoreRenderer } from '@/infrastructure/score/abcjs.score.renderer';
import { handleClientError } from '@/lib/client-error';

/**
 * useScoreRenderer
 * スコアレンダリングロジックを扱うカスタムフックです。
 * レンダラーのライフサイクルとDOM要素を管理します。
 */
export function useScoreRenderer(score: MusicalExample | { data: string; format: NotationFormat }) {
  const elementRef = useRef<HTMLDivElement>(null);

  // 依存性の注入 (簡易版)
  // レンダラーをメモ化し、レンダリング間で参照を安定させます
  // useState の lazy initialization を使用して、初回のみインスタンス化します
  const [renderer] = useState(() => new AbcjsScoreRenderer());

  useEffect(() => {
    let isMounted = true;

    const renderScore = async () => {
      if (!elementRef.current || !score) return;

      // MusicalExample の場合は metadata.notationPath を、それ以外の場合は直接 dataプロパティを見る
      // ※ 現状は notationPath に生データが入っている前提、または別途フェッチが必要な設計への布石
      const data =
        'metadata' in score && 'notationPath' in score.metadata
          ? score.metadata.notationPath
          : (score as { data: string }).data;
      const format =
        'metadata' in score && 'format' in score.metadata
          ? score.metadata.format
          : (score as { format: NotationFormat }).format;

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
