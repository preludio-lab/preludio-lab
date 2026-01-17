import { MusicalExample, MusicalExampleId } from './musical-example';

/**
 * 譜例リポジトリ インターフェース
 */
export interface MusicalExampleRepository {
  findById(id: MusicalExampleId): Promise<MusicalExample | null>;
  findByWorkId(workId: string): Promise<MusicalExample[]>;
  save(example: MusicalExample): Promise<void>;
  delete(id: MusicalExampleId): Promise<void>;
}
