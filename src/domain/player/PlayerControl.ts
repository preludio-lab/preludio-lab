import { z } from 'zod';

/**
 * PlayerControl
 * プレイヤーの制御情報。
 * IDとライフサイクル情報を管理。
 */
export const PlayerControlSchema = z.object({
  /** プレイヤーセッションのユニークID (UUID) */
  id: z.string().uuid(),
  /** 作成日時 */
  createdAt: z.coerce.date().default(() => new Date()),
  /** 更新日時 */
  updatedAt: z.coerce.date().default(() => new Date()),
});

export type PlayerControl = z.infer<typeof PlayerControlSchema>;
