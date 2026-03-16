import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

/**
 * Drizzle のトランザクションクライアントの型定義。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DrizzleTransaction = any;

/**
 * トランザクションコンテキストから DB クライアントを取得します。
 * コンテキストが存在する場合はそれを使用し、存在しない場合は指定された fallbackDb を返します。
 *
 * @param fallbackDb トランザクションがない場合に使用するデフォルトの DB インスタンス
 * @param ctx トランザクションコンテキスト（オプション）
 * @returns Drizzle のデータベースインスタンスまたはトランザクションインスタンス
 */
export function getDb(
  fallbackDb: LibSQLDatabase<typeof schema>,
  ctx?: TransactionContext,
): LibSQLDatabase<typeof schema> | DrizzleTransaction {
  if (ctx) {
    // ドメイン層からの unknown 型をインフラ層の具体的な型へキャストします。
    return ctx as DrizzleTransaction;
  }
  return fallbackDb;
}
