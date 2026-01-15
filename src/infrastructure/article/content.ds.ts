import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../storage/r2-client';

export class ArticleContentDataSource {
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME || 'preludiolab-storage';
  }

  /**
   * Fetch MDX content string from R2
   * @param path Relative path in the bucket (e.g. 'private/articles/bach/prelude.mdx')
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
      // Handle 404 or other errors gracefully
      console.warn(`Failed to fetch content from R2: ${path}`, error);
      return '';
    }
  }
}
