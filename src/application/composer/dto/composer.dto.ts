import { z } from 'zod';
import { ComposerMasterSchema } from '../master/composer-master.schema';

/**
 * Composer DTO
 * アプリケーション外部へ返す作曲家データの構造定義。
 */
export const ComposerDtoSchema = ComposerMasterSchema;

export type ComposerDto = z.infer<typeof ComposerDtoSchema>;
