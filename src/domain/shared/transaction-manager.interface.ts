export interface TransactionManager {
  /**
   * Execute a callback within a transaction.
   * NOTE: For actual consistency, the repositories used within the callback
   * must participate in the same transaction context (e.g. via CLS or propagated Context).
   */
  transaction<T>(callback: () => Promise<T>): Promise<T>;
}
