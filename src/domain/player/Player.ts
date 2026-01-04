import { z } from 'zod';
import { PlayerPlatform } from './PlayerConstants';

/**
 * プレイヤー共有のバリデーションスキーマ定義
 */

// 基本的な時間（秒）のバリデーション
const SecondsSchema = z.number().min(0).finite();

// 再生オプションのバリデーション
// startSeconds は 0以上
// endSeconds は startSeconds より大きくなければならない
export const PlayOptionsSchema = z
  .object({
    startSeconds: SecondsSchema.optional(),
    endSeconds: SecondsSchema.optional(),
  })
  .refine(
    (data) => {
      // endSeconds がある場合、startSeconds より大きいこと
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

// メタデータのバリデーション
export const PlayerMetadataSchema = z.object({
  title: z.string().optional(),
  composerName: z.string().optional(),
  performer: z.string().optional(),
  thumbnail: z.string().url().optional().or(z.literal('')), // 空文字も許容するか、url形式を強制するか
  platformUrl: z.string().url().optional(),
  platformLabel: z.string().optional(),
  platform: z.nativeEnum(PlayerPlatform).optional().nullable(),
});

// 再生リクエスト全体のバリデーション（srcは必須）
export const PlayRequestSchema = z.object({
  src: z.string().min(1, 'Source ID is required'),
  metadata: PlayerMetadataSchema.optional(),
  options: PlayOptionsSchema.optional(),
});

export type PlayOptions = z.infer<typeof PlayOptionsSchema>;
export type PlayerMetadata = z.infer<typeof PlayerMetadataSchema>;
export type PlayRequest = z.infer<typeof PlayRequestSchema>;
