import fs from 'fs';
import mime from 'mime-types';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../storage/r2.client';
import { env } from '@/lib/env';
import { Logger } from '@/shared/logging/logger';

export class R2ArticlePublisher {
  private readonly bucketName: string;

  constructor(private readonly logger: Logger) {
    this.bucketName = env.R2_BUCKET_NAME || 'preludiolab-storage';
  }

  /**
   * 画像をR2にアップロードする
   * @param localPath ローカルファイルシステムの絶対パス
   * @param r2Key R2上の保存先キー (例: public/articles/bach/images/score.svg)
   */
  async publishImage(localPath: string, r2Key: string): Promise<void> {
    if (!fs.existsSync(localPath)) {
      this.logger.warn(`Local file not found, skipping upload: ${localPath}`);
      return;
    }

    try {
      const fileContent = fs.readFileSync(localPath);
      const contentType = mime.lookup(localPath) || 'application/octet-stream';

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: r2Key,
        Body: fileContent,
        ContentType: contentType,
        // Cache-Control: max-age=31536000, public (images are immutable usually)
        CacheControl: 'max-age=31536000, public',
      });

      await r2Client.send(command);
      this.logger.info(`Uploaded image to R2: ${r2Key} (Size: ${fileContent.length} bytes)`);
    } catch (error) {
      this.logger.error(`Failed to upload image: ${r2Key}`, error as Error);
      throw error;
    }
  }
}
