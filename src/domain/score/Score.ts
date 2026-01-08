import { ScoreControl, ScoreId, ScoreFormatType } from './ScoreControl';
import { ScoreMetadata } from './ScoreMetadata';

/**
 * Score Format Constants
 */
export const ScoreFormat = {
  ABC: 'abc',
  MUSICXML: 'musicxml',
} as const;

export { type ScoreFormatType };
export { type ScoreId };

/**
 * Score Domain Entity (Edition Level)
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
 * @deprecated IScoreRenderer will be moved to MusicalExample domain or unified later.
 * Legacy interface for notation rendering.
 */
export interface IScoreRenderer {
  render(data: string, element: HTMLElement, format: ScoreFormatType): Promise<void>;
}
