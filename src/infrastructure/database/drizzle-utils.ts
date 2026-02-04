import { LibSQLDatabase } from 'drizzle-orm/libsql';
import { db as globalDb } from './turso.client';
import * as schema from './schema';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

/**
 * Drizzle のトランザクションクライアントの型定義。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DrizzleTransaction = any;

/**
 * トランザクションコンテキストから DB クライアントを取得します。
 * コンテキストが存在する場合はそれを使用し、存在しない場合はグローバルな DB インスタンスを返します。
 *
 * @param ctx トランザクションコンテキスト（オプション）
 * @returns Drizzle のデータベースインスタンスまたはトランザクションインスタンス
 */
export function getDb(
  ctx?: TransactionContext,
): LibSQLDatabase<typeof schema> | DrizzleTransaction {
  if (ctx) {
    // ドメイン層からの unknown 型をインフラ層の具体的な型へキャストします。
    return ctx as DrizzleTransaction;
  }
  return globalDb;
}
