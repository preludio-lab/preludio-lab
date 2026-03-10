import { serverLogger as logger } from '@/infrastructure/logging/server.logger';

/**
 * アプリ全体で使用する例外ハンドラ。
 * サーバーサイドで使用され、インフラ層の logger を介してログ出力と Sentry 送信を行います。
 */
export function handleError(error: unknown, context?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(err.message, err, { context });
}
