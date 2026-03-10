'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { clientLogger as logger } from '@/infrastructure/logging/client.logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Error');

  useEffect(() => {
    // エラーバウンダリは最も堅牢である必要があるため、
    // react-hot-toast 等の外部ライブラリに依存せず、最小限のログ出力に留める。
    // これにより、react-hot-toast 自体がクラッシュした場合でも
    // エラーバウンダリが正常に機能し、無限ループを防止する。
    logger.error('[ErrorBoundary]', error);

    // Sentry への送信は動的インポートで行い、失敗しても握り潰す
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.captureException(error, {
          tags: { context: 'ErrorBoundary' },
        });
      })
      .catch(() => {
        // Sentry の読み込みに失敗しても、エラーバウンダリの表示は継続する
      });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">{t('title')}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{t('description')}</p>
      <button
        onClick={
          // セグメントの再レンダリングを試みて回復を図る
          () => reset()
        }
        className="px-6 py-2 bg-primary/90 hover:bg-primary text-white font-medium rounded-full transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {t('retry')}
      </button>
    </div>
  );
}
