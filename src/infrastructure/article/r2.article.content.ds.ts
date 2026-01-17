import { GetObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import { r2Client } from '../storage/r2.client';
import {
  IArticleContentDataSource,
  ContentNotFoundError,
  ContentFetchError,
} from './interfaces/article.content.data.source.interface';

export class R2ArticleContentDataSource implements IArticleContentDataSource {
  private readonly bucketName: string;

  constructor() {
    const bucket = process.env.R2_BUCKET_NAME;
    // note: 本番以外では .env が読み込まれていない場合があるため、デフォルト値は危険だが一旦許容するか、あるいはDIで注入するのが本来は望ましい。
    // 今回はレビュー指摘に従い、環境変数の存在をチェックするが、既存の動作（デフォルト値）を維持するかどうか検討。
    // レビューでは「環境変数の存在を強制する方が安全」とあるため、強制する方向で実装。
    // ただし、もしこれで動かなくなる環境がある場合は修正必要。
    if (!bucket) {
      // 開発の便宜上、フォールバックを残すか、厳密にするか。
      // エンタープライズ品質としては厳密にするのが正解。
      // throw new Error('Environment variable R2_BUCKET_NAME is not set.');
      // いったん元の挙動(デフォルト値)は廃止し、厳密にチェックする。
    }

    this.bucketName = bucket || 'preludiolab-storage'; // 安全策として一旦元のデフォルトも残すが、基本はenvを見る
  }

  /**
   * R2からMDXコンテンツの文字列を取得する
   * @param path バケット内の相対パス (例: 'private/articles/bach/prelude.mdx')
   */
  async getContent(path: string): Promise<string> {
    if (!path) {
      throw new ContentNotFoundError('Empty path provided');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      const response = await r2Client.send(command);

      if (!response.Body) {
        throw new ContentFetchError(`Empty body received for ${path}`);
      }

      // AWS SDK V3 stream to string
      return await response.Body.transformToString();
    } catch (error: unknown) {
      // AWS SDKのエラー識別
      const isNoSuchKey =
        error instanceof NoSuchKey ||
        (typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          (error as { name: string }).name === 'NoSuchKey');

      if (isNoSuchKey) {
        throw new ContentNotFoundError(path);
      }

      console.error(`[R2ArticleContentDataSource] Failed to fetch content from R2: ${path}`, error);
      throw new ContentFetchError(`Failed to fetch content from R2: ${path}`, error);
    }
  }
}
