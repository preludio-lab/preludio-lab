/**
 * オブジェクトストレージ操作のインターフェース
 */
export interface IObjectStorage {
  /**
   * キーを指定してオブジェクトのコンテンツを取得します。
   * @param key ストレージ内のオブジェクトを一意に識別するキー
   * @returns オブジェクトのコンテンツ（通常は文字列）、見つからない場合は null
   */
  get(key: string): Promise<string | null>;
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
