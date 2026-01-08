import { z } from 'zod';

export { z };

/**
 * Zodの拡張ユーティリティ。
 * 特定の環境（Turbopack等）で .int() が ReferenceError を引き起こす問題への対策を提供します。
 */
export const zInt = (message: string = 'Must be an integer') =>
    z.number().refine(Number.isInteger, { message });
