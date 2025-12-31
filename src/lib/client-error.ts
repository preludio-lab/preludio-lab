import * as Sentry from '@sentry/nextjs';
import toast from 'react-hot-toast';

/**
 * クライアント用エラーハンドラ。
 * エラー自体はSentry等のログ収集基盤に送信されます（英語推奨）。
 * 第2引数はユーザーへのトースト通知用であり、必要に応じてi18n化されたメッセージを渡します。
 *
 * @param error 発生したエラーオブジェクト
 * @param context エラーの発生場所や文脈を示す識別子 (Sentryタグ用)
 */
export function handleClientError(
  error: unknown,
  userNotificationMessage?: string,
  context?: string,
): void {
  Sentry.captureException(error, {
    tags: { context: context ?? 'unknown' },
  });

  if (process.env.NODE_ENV === 'development') {
    console.error('[Client Error]', error, context ? `Context: ${context}` : '');
  }
  if (userNotificationMessage) toast.error(userNotificationMessage);
}
