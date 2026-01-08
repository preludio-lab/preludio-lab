import { Score } from './Score';
import { ScoreId } from './ScoreControl';

/**
 * 楽譜リポジトリ インターフェース
 */
export interface ScoreRepository {
    findById(id: ScoreId): Promise<Score | null>;
    findByWorkId(workId: string): Promise<Score[]>; // 中間テーブル等を介して検索
    save(score: Score): Promise<void>;
    delete(id: ScoreId): Promise<void>;
}
