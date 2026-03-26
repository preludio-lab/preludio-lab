import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  NoSuchKey,
} from '@aws-sdk/client-s3';
import { r2Client } from './r2.client';
import { IObjectStorage, ObjectNotFoundError, StorageError } from './storage.interface';
import { env } from '@/lib/env';
import pLimit from 'p-limit';

/**
 * IObjectStorage の R2 (S3互換) 実装クラス
 */
export class R2StorageService implements IObjectStorage {
  private readonly bucketName: string;
  private readonly _limiter = pLimit(5); // R2 への同時接続数を制限

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

      const response = await this._limiter(() => r2Client.send(command));

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

  /**
   * コンテンツを保存します。
   */
  async put(key: string, content: string): Promise<void> {
    const fullKey = this.keyPrefix ? `${this.keyPrefix}${key}` : key;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
        Body: content,
        ContentType: 'text/markdown', // 本文は通常 MDX/Markdown
      });

      await this._limiter(() => r2Client.send(command));
    } catch (error: unknown) {
      throw new StorageError(`Failed to upload object to R2: ${key}`, error);
    }
  }

  /**
   * オブジェクトを削除します。
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.keyPrefix ? `${this.keyPrefix}${key}` : key;

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fullKey,
      });

      await this._limiter(() => r2Client.send(command));
    } catch (error: unknown) {
      throw new StorageError(`Failed to delete object from R2: ${key}`, error);
    }
  }
}
