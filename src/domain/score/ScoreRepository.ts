import { Score } from './Score';

/**
 * 楽譜リポジトリ インターフェース
 */
export interface ScoreRepository {
  findById(id: string): Promise<Score | null>;
  findByWorkId(workId: string): Promise<Score[]>; // 中間テーブル等を介して検索
  save(score: Score): Promise<void>;
  delete(id: string): Promise<void>;
}
