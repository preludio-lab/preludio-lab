import fs from 'fs';
import path from 'path';
import { IObjectStorage, ObjectNotFoundError, StorageError } from './storage.interface';

/**
 * IObjectStorage のファイルシステム実装クラス
 */
export class FileSystemStorageService implements IObjectStorage {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.cwd();
  }

  /**
   * 指定されたキー（相対パスまたは絶対パス）からファイルの内容を読み込みます。
   */
  async get(key: string): Promise<string | null> {
    if (!key) {
      return null;
    }

    try {
      // key is treated as a relative path from baseDir
      const resolvedPath = path.isAbsolute(key) ? key : path.join(this.baseDir, key);

      if (!fs.existsSync(resolvedPath)) {
        throw new ObjectNotFoundError(key);
      }

      return fs.readFileSync(resolvedPath, 'utf8');
    } catch (error: unknown) {
      if (error instanceof ObjectNotFoundError) {
        throw error;
      }
      throw new StorageError(`Failed to read file from disk: ${key}`, error);
    }
  }

  /**
   * 指定されたキーにコンテンツを書き込みます。
   */
  async put(key: string, content: string): Promise<void> {
    try {
      const resolvedPath = path.isAbsolute(key) ? key : path.join(this.baseDir, key);
      const parentDir = path.dirname(resolvedPath);

      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      fs.writeFileSync(resolvedPath, content, 'utf8');
    } catch (error: unknown) {
      throw new StorageError(`Failed to write file to disk: ${key}`, error);
    }
  }

  /**
   * 指定されたキーのファイルを削除します。
   */
  async delete(key: string): Promise<void> {
    try {
      const resolvedPath = path.isAbsolute(key) ? key : path.join(this.baseDir, key);

      if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath);
      }
    } catch (error: unknown) {
      throw new StorageError(`Failed to delete file from disk: ${key}`, error);
    }
  }
}
