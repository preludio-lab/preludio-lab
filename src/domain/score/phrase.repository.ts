import { Phrase, PhraseId } from './phrase';

/**
 * フレーズリポジトリ インターフェース
 */
export interface PhraseRepository {
  findById(id: PhraseId): Promise<Phrase | null>;
  findByWorkId(workId: string): Promise<Phrase[]>;
  save(phrase: Phrase): Promise<void>;
  deleteById(id: PhraseId): Promise<void>;
}
