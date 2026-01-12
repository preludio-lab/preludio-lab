import { z } from 'zod';
import { ResourcePathSchema, UrlSchema } from '@/domain/shared/CommonMetadata';
import { PlayerProviderSchema } from './PlayerProvider';

/**
 * PlayerDisplay
 * プレイヤーの表示用メタデータの投影インターフェース。
 */
export const PlayerDisplaySchema = z.object({
  /** 表示用タイトル */
  title: z.string().max(100),
  /** 作曲家名 (Optional) */
  composerName: z.string().max(50).optional(),
  /** 演奏者名 (Optional) */
  performer: z.string().max(50).optional(),
  /** サムネイル画像URL (内部パスまたは外部URL) */
  image: ResourcePathSchema.optional(),
  /** 元コンテンツへのリンクURL (絶対URL) */
  sourceUrl: UrlSchema.optional(),
  /** UI表示用のプロバイダ種別 */
  provider: PlayerProviderSchema.default('generic'),
  /** プロバイダ表示ラベル (e.g. "Watch on YouTube") (Optional) */
  providerLabel: z.string().max(50).optional(),
});

export type PlayerDisplay = z.infer<typeof PlayerDisplaySchema>;
