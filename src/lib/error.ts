import * as Sentry from '@sentry/nextjs';

/**
 * アプリ全体で使用する例外ハンドラ。
 * - Sentry に例外を送信
 * - console.error でスタックトレースを出力（開発時のみ）
 * - 必要に応じて UI フィードバックをトリガー
 */
export function handleError(error: unknown, context?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));

  // Sentry に例外を送信
  Sentry.captureException(err, {
    tags: { context: context ?? 'unknown' },
  });

  // 開発環境では console.error で詳細を出力
  // クライアント側は別ハンドラに委譲。サーバー側は PinoLogger を使用するのでここでは何もしない。
  if (process.env.NODE_ENV === 'development') {
    console.error('[Server Error]', err);
  }
}
