/**
 * オブジェクトストレージ操作のインターフェース
 */
export interface IObjectStorage {
  /**
   * キーを指定してオブジェクトのコンテンツを取得します。
   */
  get(key: string): Promise<string | null>;

  /**
   * キーを指定してコンテンツを保存します。
   */
  put(key: string, content: string): Promise<void>;

  /**
   * キーを指定してオブジェクトを削除します。
   */
  delete(key: string): Promise<void>;
}

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ObjectNotFoundError extends StorageError {
  constructor(key: string) {
    super(`Object not found: ${key}`);
    this.name = 'ObjectNotFoundError';
  }
}
