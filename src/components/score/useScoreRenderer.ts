import { useEffect, useRef } from 'react';
import { Score } from '@/domain/score/Score';
import { AbcjsScoreRenderer } from '@/infrastructure/score/AbcjsScoreRenderer';
import { handleClientError } from '@/lib/client-error';

/**
 * useScoreRenderer
 * スコアレンダリングロジックを扱うカスタムフックです。
 * レンダラーのライフサイクルとDOM要素を管理します。
 */
export function useScoreRenderer(score: Score) {
    const elementRef = useRef<HTMLDivElement>(null);

    // 依存性の注入 (簡易版)
    // レンダラーをメモ化し、レンダリング間で参照を安定させます
    const renderer = useRef(new AbcjsScoreRenderer()).current;

    useEffect(() => {
        let isMounted = true;

        const renderScore = async () => {
            if (!elementRef.current || !score) return;

            try {
                if (process.env.NODE_ENV === 'development') {
                    console.debug('useScoreRenderer: rendering started', { format: score.format });
                }

                await renderer.render(score, elementRef.current);

                if (isMounted && process.env.NODE_ENV === 'development') {
                    console.debug('useScoreRenderer: rendering completed');
                }
            } catch (error) {
                if (isMounted) {
                    handleClientError(error, 'Failed to render score');
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
