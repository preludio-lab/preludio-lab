
import { zInt } from '@/shared/validation/zod';

/**
 * SecondsSchema
 * 基本的な時間（秒）のバリデーション (最大24時間 = 86400秒)
 * 0以上の整数。
 */
export const SecondsSchema = zInt().min(0).max(86400);

