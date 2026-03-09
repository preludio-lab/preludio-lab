import toast from 'react-hot-toast';
import { ConsoleLogger } from '@/infrastructure/logging/console.logger';

const logger = new ConsoleLogger();

/**
 * クライアント用エラーハンドラ。
 * ConsoleLogger を介してログ出力と Sentry 送信を行い、オプションでトースト通知を表示します。
 *
 * @param error 発生したエラーオブジェクト
 * @param userNotificationMessage ユーザーに表示するトーストメッセージ (通知が不要な場合は省略可)
 * @param context エラーの発生場所や文脈を示す識別子 (Sentryタグ用)
 */
export function handleClientError(
  error: unknown,
  userNotificationMessage?: string,
  context?: string,
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(err.message, err, { context });

  if (userNotificationMessage) toast.error(userNotificationMessage);
}
