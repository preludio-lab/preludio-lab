import { z } from 'zod';
import { ScoreControlSchema } from './ScoreControl';
import { ScoreMetadataSchema } from './ScoreMetadata';

/**
 * Score (Asset/Edition)
 * 楽譜エディションのルートエンティティ。
 */
export const ScoreSchema = z.object({
  control: ScoreControlSchema,
  metadata: ScoreMetadataSchema,
});

export type Score = z.infer<typeof ScoreSchema>;

/**
 * Score の生成
 */
export const createScore = (control: any, metadata: any): Score => {
  return ScoreSchema.parse({
    control,
    metadata,
  });
};

// IScoreRenderer はインターフェースなので Zod 対象外だが型は使用する
import { ScoreFormatType } from './ScoreFormat';
export { ScoreFormat, type ScoreFormatType } from './ScoreFormat';

/**
 * IScoreRenderer
 * @deprecated
 */
export interface IScoreRenderer {
  render(data: string, element: HTMLElement, format: ScoreFormatType): Promise<void>;
}
