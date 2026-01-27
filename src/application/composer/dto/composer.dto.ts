import { z } from 'zod';
import { ComposerDataSchema } from '@/domain/composer/composer.schema';

/**
 * Composer DTO
 * アプリケーション外部へ返す作曲家データの構造定義。
 * 現状はドメインスキーマと同一ですが、露出制御が必要な場合にここで拡張します。
 */
export const ComposerDtoSchema = ComposerDataSchema; // Currently direct mapping, but separated for conceptual layering

export type ComposerDto = z.infer<typeof ComposerDtoSchema>;
