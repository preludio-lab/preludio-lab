import { Score, ScoreId } from './Score';

/**
 * 楽譜リポジトリ インターフェース
 * 楽譜エディションの永続化を担います。
 */
export interface ScoreRepository {
    findById(id: ScoreId): Promise<Score | null>;
    findByWorkId(workId: string): Promise<Score[]>;
    save(score: Score): Promise<void>;
    delete(id: ScoreId): Promise<void>;
}
