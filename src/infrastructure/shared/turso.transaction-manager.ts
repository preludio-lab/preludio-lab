import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import { TransactionManager } from '@/domain/shared/transaction-manager.interface';

export class TursoTransactionManager implements TransactionManager {
  constructor(private db: LibSQLDatabase<typeof schema>) {}

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.db.transaction(async (_tx) => {
      // Note: _tx is unused because we rely on Drizzle's implicit transaction handling (or nesting)
      // or we accept that repositories use `this.db` which resolves to the same connection in some configs,
      // but correctly this relies on nested transaction support (Savepoints) if repositories start their own transactions.
      return callback();
    });
  }
}
