export interface IArticleContentDataSource {
  /**
   * コンテンツを取得する
   * @param path コンテンツのパス
   * @returns コンテンツの文字列
   * @throws {ContentNotFoundError} コンテンツが存在しない場合
   * @throws {ContentFetchError} ストレージへのアクセスに失敗した場合
   */
  getContent(path: string): Promise<string>;
}

export class ContentNotFoundError extends Error {
  constructor(path: string) {
    super(`Content not found at path: ${path}`);
    this.name = 'ContentNotFoundError';
  }
}

export class ContentFetchError extends Error {
  constructor(
    message: string,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'ContentFetchError';
  }
}
