import { ScoreControl } from './ScoreControl';
import { ScoreMetadata } from './ScoreMetadata';
import { ScoreFormatType } from './ScoreFormat';

/**
 * Score (Asset/Edition)
 * 楽譜エディションのルートエンティティ。
 * 複数の楽曲（Work）を含む可能性があるため、Workとの直接の強固な紐付けは持ちません。
 */
export interface Score {
  readonly control: ScoreControl;
  readonly metadata: ScoreMetadata;
}

export const createScore = (control: ScoreControl, metadata: ScoreMetadata): Score => ({
  control,
  metadata,
});

/**
 * IScoreRenderer
 * 楽譜レンダリングのインターフェース
 * @deprecated 譜例（MusicalExample）の導入に伴い、今後は MusicalExample を主体としたレンダリングに移行します。
 */
export interface IScoreRenderer {
  render(data: string, element: HTMLElement, format: ScoreFormatType): Promise<void>;
}

// 既存コードとの互換性のために re-export (必要に応じて)
export { ScoreFormat, type ScoreFormatType } from './ScoreFormat';
