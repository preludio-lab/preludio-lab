import { ScoreControl, ScoreId, ScoreFormatType } from './ScoreControl';
import { ScoreMetadata } from './ScoreMetadata';

/**
 * 楽譜フォーマット定数
 * サポートされている記法フォーマットを定義します。
 */
export const ScoreFormat = {
  ABC: 'abc',
  MUSICXML: 'musicxml',
} as const;

export { type ScoreFormatType };
export { type ScoreId };

/**
 * 楽譜ドメインエンティティ (エディションレベル)
 * 特定の楽曲の「版（エディション）」を表現します。
 */
export interface Score {
  readonly control: ScoreControl;
  readonly metadata: ScoreMetadata;
}

export const createScore = (
  control: ScoreControl,
  metadata: ScoreMetadata
): Score => ({
  control,
  metadata,
});

/**
 * @deprecated IScoreRenderer は将来的に MusicalExample ドメインに移動されるか、統合される予定です。
 * 楽譜レンダリング用のレガシーインターフェース。
 */
export interface IScoreRenderer {
  render(data: string, element: HTMLElement, format: ScoreFormatType): Promise<void>;
}
