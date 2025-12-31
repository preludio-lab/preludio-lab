/**
 * Score Format Constants
 * サポートされている記法フォーマットを定義します。
 */
export const ScoreFormat = {
  ABC: 'abc',
  MUSICXML: 'musicxml', // 将来的なサポート
} as const;

export type ScoreFormatType = (typeof ScoreFormat)[keyof typeof ScoreFormat];

/**
 * Score Entity
 * 特定の記法フォーマットに依存しない、音楽スコアを表すエンティティです。
 */
export interface Score {
  format: ScoreFormatType;
  data: string; // 生の文字列コンテンツ (ABC文字列, XML文字列など)

  // Metadata (Optional)
  // 生データ(data)にメタデータが含まれていない場合、
  // またはアプリケーション側でメタデータを上書き/補完する必要がある場合に使用します。
  title?: string;
}

/**
 * IScoreRenderer Interface
 * スコアレンダリングエンジンの抽象インターフェースです。
 * インフラストラクチャ層の実装が具体的なライブラリ (例: abcjs) を処理します。
 */
export interface IScoreRenderer {
  /**
   * 指定されたHTML要素にスコアをレンダリングします。
   * @param score レンダリング対象のスコアエンティティ
   * @param element コンテナとなるHTML要素
   */
  render(score: Score, element: HTMLElement): Promise<void>;
}
