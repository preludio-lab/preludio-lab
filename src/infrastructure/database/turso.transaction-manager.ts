import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import {
  TransactionManager,
  TransactionContext,
} from '@/domain/shared/transaction-manager.interface';

export class TursoTransactionManager implements TransactionManager {
  constructor(private db: LibSQLDatabase<typeof schema>) {}

  async run<T>(callback: (ctx: TransactionContext) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      /**
       * Drizzle のトランザクションクライアント (tx) をコールバックに渡します。
       * これにより、リポジトリ側でこの ctx を受け取り、同じトランザクション内でクエリを実行できます。
       */
      return await callback(tx);
    });
  }
}
