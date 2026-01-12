import { z } from 'zod';
import { ResourcePathSchema, UrlSchema } from '@/domain/shared/CommonMetadata';
import { PlayerProviderSchema } from './PlayerProvider';

/**
 * PlayerDisplay
 * プレイヤーの表示用メタデータの投影インターフェース。
 */
export const PlayerDisplaySchema = z.object({
  /** 表示用タイトル */
  title: z.string().max(50),
  /** 演奏者名 */
  performer: z.string().max(50).optional(),
  /** サムネイル画像URL (内部パスまたは外部URL) */
  image: ResourcePathSchema.optional(),
  /** 元コンテンツへのリンクURL (絶対URL) */
  sourceUrl: UrlSchema.optional(),
  /** UI表示用のラベル種別 */
  provider: PlayerProviderSchema.default('generic'),
});

export type PlayerDisplay = z.infer<typeof PlayerDisplaySchema>;
