import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../storage/r2-client';

export class ArticleContentDataSource {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME || 'preludiolab-storage';
  }

  /**
   * R2からMDXコンテンツの文字列を取得する
   * @param path バケット内の相対パス (例: 'private/articles/bach/prelude.mdx')
   */
  async getContent(path: string): Promise<string> {
    if (!path) return '';

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      const response = await r2Client.send(command);
      if (!response.Body) {
        return '';
      }

      // AWS SDK V3 stream to string
      return await response.Body.transformToString();
    } catch (error) {
      // 404やその他のエラーを適切に処理する
      console.warn(`Failed to fetch content from R2: ${path}`, error);
      return '';
    }
  }
}
