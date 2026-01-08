import { z } from 'zod';
import { ScoreControlSchema } from './ScoreControl';
import { ScoreMetadataSchema, ScoreFormat, ScoreFormatType } from './ScoreMetadata';

/**
 * Score (Asset/Edition)
 * 楽譜エディションのルートエンティティ。
 */
export const ScoreSchema = z.object({
  control: ScoreControlSchema,
  metadata: ScoreMetadataSchema,
});

export type Score = z.infer<typeof ScoreSchema>;

// 再エクスポート
export { ScoreFormat, type ScoreFormatType };

/**
 * IScoreRenderer
 * @deprecated
 */
export interface IScoreRenderer {
  render(data: string, element: HTMLElement, format: ScoreFormatType): Promise<void>;
}
