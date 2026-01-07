import { z } from 'zod';
import { PlayerPlatform } from './PlayerConstants';

/**
 * プレイヤー共有のバリデーションスキーマ定義
 */

// 基本的な時間（秒）のバリデーション
const SecondsSchema = z.number().min(0).finite();

/** 再生オプション (開始・終了位置など) */
export const PlayOptionsSchema = z
  .object({
    /** 再生開始位置 (秒) */
    startSeconds: SecondsSchema.optional(),
    /** 再生終了位置 (秒) */
    endSeconds: SecondsSchema.optional(),
  })
  .refine(
    (data) => {
      /** endSeconds がある場合、startSeconds より大きいこと */
      if (data.startSeconds !== undefined && data.endSeconds !== undefined) {
        return data.endSeconds > data.startSeconds;
      }
      return true;
    },
    {
      message: 'endSeconds must be greater than startSeconds',
      path: ['endSeconds'],
    },
  );

/** 再生中に表示されるメタデータ */
export const PlayerMetadataSchema = z.object({
  /** 作品タイトル */
  title: z.string().optional(),
  /** 作曲家名 */
  composerName: z.string().optional(),
  /** 演奏者名 */
  performer: z.string().optional(),
  /** サムネイル画像URL */
  thumbnail: z.string().url().optional().or(z.literal('')),
  /** プラットフォームのURL (YouTube等) */
  platformUrl: z.string().url().optional(),
  /** プラットフォーム名 */
  platformLabel: z.string().optional(),
  /** プラットフォームの種別 (PlayerPlatform) */
  platform: z.nativeEnum(PlayerPlatform).optional().nullable(),
});

/** 再生リクエスト全体の構造 */
export const PlayRequestSchema = z.object({
  /** 音源識別子 (YouTube ID等) */
  src: z.string().min(1, 'Source ID is required'),
  /** 付随するメタデータ */
  metadata: PlayerMetadataSchema.optional(),
  /** 再生オプション (区間指定等) */
  options: PlayOptionsSchema.optional(),
});

/** 再生オプションの型定義 */
export type PlayOptions = z.infer<typeof PlayOptionsSchema>;
/** プレイヤーメタデータの型定義 */
export type PlayerMetadata = z.infer<typeof PlayerMetadataSchema>;
/** 再生リクエストの型定義 */
export type PlayRequest = z.infer<typeof PlayRequestSchema>;
