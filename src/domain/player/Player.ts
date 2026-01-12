import { z } from 'zod';
import { PlayerControlSchema, PlayerControl } from './PlayerControl';
import { PlayerDisplaySchema, PlayerDisplay, PlayerProviderType } from './PlayerDisplay';
import {
  PlayerSourceSchema,
  PlayerSource,
  PlayerPlatform,
  PlayerPlatformType,
} from './PlayerSource';
import { PlayerStatusSchema, PlayerStatus, PlayerMode } from './PlayerStatus';

/**
 * Player Entity
 * プレイヤーのドメインエンティティ (Aggregate Root / Coordinator)
 * 制御(Control)、表示(Display)、ソース(Source)、状態(Status)を束ねる。
 */
export const PlayerSchema = z.object({
  control: PlayerControlSchema,
  display: PlayerDisplaySchema,
  source: PlayerSourceSchema,
  status: PlayerStatusSchema,
});

/** プレイヤーのプロパティ定義 */
export type PlayerProps = z.infer<typeof PlayerSchema>;

/**
 * Player
 * プレイヤーのドメインエンティティ (Aggregate Root / Coordinator)
 * 制御(Control)、表示(Display)、ソース(Source)、状態(Status)を束ねる。
 */
export class Player implements PlayerProps {
  /** 制御情報: ID、作成・更新日時などのライフサイクル管理 */
  readonly control: PlayerControl;
  /** 表示情報: タイトル、演奏者、画像などのUI投影用データ */
  readonly display: PlayerDisplay;
  /** 技術ソース: 再生の実体データ（YouTube ID、開始/終了秒数等） */
  readonly source: PlayerSource;
  /** 実行状態: 再生中フラグ、現在時間、音量、表示モード等 */
  readonly status: PlayerStatus;

  constructor(props: PlayerProps) {
    this.control = props.control;
    this.display = props.display;
    this.source = props.source;
    this.status = props.status;
  }

  // --- Convenience Getters ---
  get id() {
    return this.control.id;
  }
  get title() {
    return this.display.title;
  }
  get isPlaying() {
    return this.status.isPlaying;
  }
}

// --- Re-exports for convenience ---
export { PlayerControlSchema };
export type { PlayerControl };
export { PlayerDisplaySchema, PlayerProviderType };
export type { PlayerDisplay };
export { PlayerSourceSchema, PlayerPlatform };
export type { PlayerSource, PlayerPlatformType };
export { PlayerStatusSchema, PlayerMode };
export type { PlayerStatus };

// Legacy alias and compatibility export (if needed for transition)
export type PlayableSource = PlayerSource;
export const PlayableSourceSchema = PlayerSourceSchema;
export type PlayRequest = PlayerSource;
export const PlayRequestSchema = PlayerSourceSchema;
