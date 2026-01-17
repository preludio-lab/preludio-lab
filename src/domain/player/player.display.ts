import { z } from 'zod';
import { ResourcePathSchema, UrlSchema } from '@/domain/shared/common-metadata';
import { PlayerProviderSchema } from './player-shared';

/**
 * DisplayType
 * プレイヤーのコンテンツ表示形式（聴かせるか、見せるか）
 */
export const DisplayType = {
  AUDIO: 'audio',
  VIDEO: 'video',
} as const;

export type DisplayType = (typeof DisplayType)[keyof typeof DisplayType];

export const DisplayTypeSchema = z.nativeEnum(DisplayType);

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
  /** 表示タイプ (audio | video) */
  displayType: DisplayTypeSchema.default('audio'),
});

export type PlayerDisplay = z.infer<typeof PlayerDisplaySchema>;
