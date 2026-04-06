import { TransactionContext } from '@/domain/shared/transaction-manager.interface';
import * as schema from '@/infrastructure/database/schema';

/**
 * scores テーブルの単一行モデル
 */
export type ScoreRow = typeof schema.scores.$inferSelect;

/**
 * JOIN済みデータの型定義 (スラグ解決用)
 */
export type ScoreRows = {
  score: ScoreRow;
  translations: (typeof schema.scoreTranslations.$inferSelect)[];
};

/**
 * 楽譜データソース インターフェース
 */
export interface IScoreDataSource {
  findById(id: string, ctx?: TransactionContext): Promise<ScoreRows | null>;
  /**
   * スラグに基づく解決 (現状は ID で代用、将来の Slug カラム対応時に修正)
   */
  findBySlug(slug: string, ctx?: TransactionContext): Promise<ScoreRows | null>;
}
