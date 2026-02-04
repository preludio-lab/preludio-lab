/**
 * トランザクションコンテキストの抽象型。
 * 具体的なDBライブラリ（Drizzle等）への依存を排除するため、unknownとして定義します。
 */
export type TransactionContext = unknown;

/**
 * トランザクション管理のインターフェース。
 * ドメイン層はこのインターフェースを通じて、DB技術に依存せずに原子性を要求します。
 */
export interface TransactionManager {
  /**
   * トランザクションを実行します。
   * コールバック関数には、現在のトランザクションコンテキストが渡されます。
   *
   * @param callback トランザクション内で実行する処理。引数にコンテキストを受け取ります。
   * @returns コールバックの戻り値
   */
  run<T>(callback: (ctx: TransactionContext) => Promise<T>): Promise<T>;
}
