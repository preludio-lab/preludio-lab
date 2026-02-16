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
import { preprocessMdx } from './mdx.preprocessor';

// ... existing imports
import fs from 'fs';
import path from 'path';

export class R2ArticleContentDataSource implements IArticleContentDataSource {
  private readonly bucketName: string;

  constructor(private readonly logger: Logger) {
    this.bucketName = env.R2_BUCKET_NAME || 'preludiolab-storage';
  }

  /**
   * R2からMDXコンテンツの文字列を取得する
   * @param path バケット内の相対パス (例: 'private/articles/bach/prelude.mdx')
   */
  async getContent(pathStr: string): Promise<string> {
    if (!pathStr) {
      throw new ContentNotFoundError('Empty path provided');
    }

    // Path transformation:
    // Input (Logical): {lang}/{category}/{slug}.mdx
    // Output (Physical): private/articles/{category}/{slug}/mdx/{lang}.mdx

    let key = pathStr;
    const parts = pathStr.split('/');
    // Check if it looks like a logical path (at least 3 segments: lang, category, slug...) and ends with .mdx
    if (parts.length >= 3 && pathStr.endsWith('.mdx')) {
      const lang = parts[0];
      const category = parts[1];
      const slugWithExt = parts.slice(2).join('/');
      const slug = slugWithExt.replace(/\.mdx$/, '');

      // Construct new R2 key
      key = `private/articles/${category}/${slug}/mdx/${lang}.mdx`;
      this.logger.debug(`Mapped logical path ${pathStr} to R2 key ${key}`);
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await r2Client.send(command);

      if (!response.Body) {
        throw new ContentFetchError(`Empty body received for ${pathStr}`);
      }

      // AWS SDK V3 stream to string
      const rawContent = await response.Body.transformToString();

      // Frontmatterをパースして、コンテンツ部分のみを返す
      const { content } = matter(rawContent);
      return preprocessMdx(content);
    } catch (error: unknown) {
      // --- FALLBACK LOGIC FOR DEV/STAGING/TEST ---
      // In non-production, if R2 fails (NoSuchKey, Connection Refused, etc.), try local Gold Set.
      if (process.env.NEXT_PUBLIC_APP_ENV !== 'production') {
        this.logger.warn(
          `[Content Fallback] R2 fetch failed (${pathStr}). Attempting local Gold Set fallback... Error: ${(error as Error).message}`,
        );
        try {
          // Try to resolve path against Gold Set location
          // pathStr is like: ja/works/1-prelude.mdx
          const localPath = path.join(
            process.cwd(),
            'src/shared/fixtures/gold-set/content/mdx',
            pathStr,
          );

          if (fs.existsSync(localPath)) {
            this.logger.info(`[Content Fallback] Serving from local Gold Set: ${localPath}`);
            const fileContents = fs.readFileSync(localPath, 'utf8');
            const { content } = matter(fileContents);
            return preprocessMdx(content);
          } else {
            this.logger.debug(`[Content Fallback] Local file not found: ${localPath}`);
          }
        } catch (fallbackError) {
          this.logger.error(`[Content Fallback] Failed to read local file`, fallbackError as Error);
        }
      }

      // AWS SDKのエラー識別
      const isNoSuchKey =
        error instanceof NoSuchKey ||
        (typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          (error as { name: string }).name === 'NoSuchKey');

      if (isNoSuchKey) {
        this.logger.warn(`Content not found in R2: ${pathStr}`, {
          bucket: this.bucketName,
          path: pathStr,
        });
        throw new ContentNotFoundError(pathStr);
      }

      this.logger.error(`Failed to fetch content from R2: ${pathStr}`, error as Error, {
        bucket: this.bucketName,
        path: pathStr,
      });
      throw new ContentFetchError(`Failed to fetch content from R2: ${pathStr}`, error);
    }
  }
}
