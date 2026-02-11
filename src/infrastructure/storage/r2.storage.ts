import { GetObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import { r2Client } from './r2.client';
import { IObjectStorage, ObjectNotFoundError, StorageError } from './storage.interface';
import { env } from '@/lib/env';

/**
 * IObjectStorage の R2 (S3互換) 実装クラス
 */
export class R2StorageService implements IObjectStorage {
  private readonly bucketName: string;

  constructor(
    bucketName?: string,
    private readonly keyPrefix: string = '',
  ) {
    this.bucketName = bucketName || env.R2_BUCKET_NAME || 'preludiolab-storage';
  }

  /**
   * 指定されたキーのオブジェクトを取得します。
   */
  async get(key: string): Promise<string | null> {
    if (!key) {
      return null;
    }

    const fullKey = this.keyPrefix ? `${this.keyPrefix}${key}` : key;

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
      });

      const response = await r2Client.send(command);

      if (!response.Body) {
        return null;
      }

      return await response.Body.transformToString();
    } catch (error: unknown) {
      const isNoSuchKey =
        error instanceof NoSuchKey ||
        (typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          (error as { name: string }).name === 'NoSuchKey');

      if (isNoSuchKey) {
        throw new ObjectNotFoundError(key);
      }

      throw new StorageError(`Failed to fetch object from R2: ${key}`, error);
    }
  }
}
