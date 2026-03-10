import { useEffect, useRef, useState } from 'react';
import { NotationFormat } from '@/domain/score/score';
import { Phrase } from '@/domain/score/phrase';
import { AbcjsScoreRenderer } from '@/infrastructure/score/abcjs.score.renderer';
import { handleClientError } from '@/lib/client-error';
import { clientLogger } from '@/infrastructure/logging/client.logger';

const logger = clientLogger;

/**
 * usePhraseRenderer
 * フレーズレンダリングロジックを扱うカスタムフックです。
 * レンダラーのライフサイクルとDOM要素を管理します。
 */
export function usePhraseRenderer(phrase: Phrase | { data: string; format: NotationFormat }) {
  const elementRef = useRef<HTMLDivElement>(null);

  // 依存性の注入 (簡易版)
  // レンダラーをメモ化し、レンダリング間で参照を安定させます
  // useState の lazy initialization を使用して、初回のみインスタンス化します
  const [renderer] = useState(() => new AbcjsScoreRenderer());

  useEffect(() => {
    let isMounted = true;

    const renderPhrase = async () => {
      if (!elementRef.current || !phrase) return;

      // Phrase の場合は metadata.notationPath を、それ以外の場合は直接 dataプロパティを見る
      // ※ 現状は notationPath に生データが入っている前提、または別途フェッチが必要な設計への布石
      const data =
        'metadata' in phrase && 'notationPath' in phrase.metadata
          ? phrase.metadata.notationPath
          : (phrase as { data: string }).data;
      const format =
        'metadata' in phrase && 'format' in phrase.metadata
          ? phrase.metadata.format
          : (phrase as { format: NotationFormat }).format;

      try {
        logger.debug('usePhraseRenderer: レンダリングを開始しました', { format });

        await renderer.render(data, elementRef.current, format);

        if (isMounted) {
          logger.debug('usePhraseRenderer: レンダリングが完了しました');
        }
      } catch (error) {
        if (isMounted) {
          handleClientError(error, 'フレーズのレンダリングに失敗しました');
        }
      }
    };

    renderPhrase();

    return () => {
      isMounted = false;
    };
  }, [phrase, renderer]);

  return { elementRef };
}
