import { GetObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import matter from 'gray-matter';
import { r2Client } from '../storage/r2.client';
import {
  IArticleContentDataSource,
  ContentNotFoundError,
  ContentFetchError,
} from './interfaces/article.content.ds.interface';
import { env } from '@/lib/env';
import { Logger } from '@/shared/logging/logger';

export class R2ArticleContentDataSource implements IArticleContentDataSource {
  private readonly bucketName: string;

  constructor(private readonly logger: Logger) {
    this.bucketName = env.R2_BUCKET_NAME || 'preludiolab-storage';
  }

  /**
   * R2からMDXコンテンツの文字列を取得する
   * @param path バケット内の相対パス (例: 'private/articles/bach/prelude.mdx')
   */
  async getContent(path: string): Promise<string> {
    if (!path) {
      throw new ContentNotFoundError('Empty path provided');
    }

    // Path transformation:
    // Input (Logical): {lang}/{category}/{slug}.mdx
    // Output (Physical): private/articles/{category}/{slug}/mdx/{lang}.mdx

    let key = path;
    const parts = path.split('/');
    // Check if it looks like a logical path (at least 3 segments: lang, category, slug...) and ends with .mdx
    if (parts.length >= 3 && path.endsWith('.mdx')) {
      const lang = parts[0];
      const category = parts[1];
      const slugWithExt = parts.slice(2).join('/');
      const slug = slugWithExt.replace(/\.mdx$/, '');

      // Construct new R2 key
      key = `private/articles/${category}/${slug}/mdx/${lang}.mdx`;
      this.logger.debug(`Mapped logical path ${path} to R2 key ${key}`);
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await r2Client.send(command);

      if (!response.Body) {
        throw new ContentFetchError(`Empty body received for ${path}`);
      }

      // AWS SDK V3 stream to string
      const rawContent = await response.Body.transformToString();

      // Frontmatterをパースして、コンテンツ部分のみを返す
      const { content } = matter(rawContent);
      return content;
    } catch (error: unknown) {
      // AWS SDKのエラー識別
      const isNoSuchKey =
        error instanceof NoSuchKey ||
        (typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          (error as { name: string }).name === 'NoSuchKey');

      if (isNoSuchKey) {
        this.logger.warn(`Content not found in R2: ${path}`, { bucket: this.bucketName, path });
        throw new ContentNotFoundError(path);
      }

      this.logger.error(`Failed to fetch content from R2: ${path}`, error as Error, {
        bucket: this.bucketName,
        path,
      });
      throw new ContentFetchError(`Failed to fetch content from R2: ${path}`, error);
    }
  }
}
