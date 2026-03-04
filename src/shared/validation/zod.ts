import { z } from 'zod';

export { z };

/**
 * Zodの拡張ユーティリティ。
 * z.number().int() を返し、.min()/.max() などの数値バリデーションをチェーン可能にする。
 */
export const zInt = () => z.number().int();
