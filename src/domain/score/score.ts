import { z } from 'zod';
import { ScoreControlSchema } from './score.control';
import { ScoreMetadataSchema, ScoreFormat } from './score.metadata';
import { NotationFormat } from './musical-example.metadata';

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
export { ScoreFormat, NotationFormat };

/**
 * INotationRenderer
 * 譜例の描画を担当するインターフェフェース
 */
export interface INotationRenderer {
  render(data: string, element: HTMLElement, format: NotationFormat): Promise<void>;
}
