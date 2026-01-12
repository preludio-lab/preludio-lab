import { z } from 'zod';
import { ResourcePathSchema, UrlSchema } from '@/domain/shared/CommonMetadata';

/**
 * 表示用プラットフォーム種別
 */
export const PlayerProviderType = {
  /** YouTube動画 */
  YOUTUBE: 'youtube',
  /** Spotify 埋め込みプレイヤー */
  SPOTIFY: 'spotify',
  /** SoundCloud 埋め込みプレイヤー */
  SOUNDCLOUD: 'soundcloud',
  /** Apple Music 埋め込みプレイヤー */
  APPLE_MUSIC: 'apple-music',
  /** ホストされた音声ファイル (mp3, wav, etc. / Cloudflare R2など) */
  FILES: 'files',
  /** その他・汎用 */
  GENERIC: 'generic',
} as const;

export type PlayerProviderType = (typeof PlayerProviderType)[keyof typeof PlayerProviderType];

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
  /** UI表示用のアイコン種別 */
  providerType: z.nativeEnum(PlayerProviderType).default(PlayerProviderType.GENERIC),
});

export type PlayerDisplay = z.infer<typeof PlayerDisplaySchema>;
