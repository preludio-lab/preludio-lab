import { customType } from 'drizzle-orm/sqlite-core';

/**
 * Turso (libSQL) のベクトル型定義
 * @param dimensions ベクトルの次元数 (e.g., 384 for multilingual-e5-small)
 */
export const libsqlVector = (dimensions: number) =>
  customType<{ data: number[]; driverData: Buffer }>({
    dataType() {
      // F32BLOB に変更 (BLOB Affinity を強制し、ベクトル検索に最適化)
      return `F32BLOB(${dimensions})`;
    },
    fromDriver(value: Buffer): number[] {
      if (!(value instanceof Buffer)) {
        return [];
      }
      return Array.from(new Float32Array(value.buffer, value.byteOffset, value.byteLength / 4));
    },
    toDriver(value: number[]): Buffer {
      // number配列をlibSQLが解釈できるBufferに変換
      return Buffer.from(new Float32Array(value).buffer);
    },
  });
