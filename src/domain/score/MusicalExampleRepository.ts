import { MusicalExample, MusicalExampleId } from './MusicalExample';

/**
 * MusicalExampleRepository Interface
 */
export interface MusicalExampleRepository {
    findById(id: MusicalExampleId): Promise<MusicalExample | null>;
    findByWorkId(workId: string): Promise<MusicalExample[]>;
    findByArticleId(articleId: string): Promise<MusicalExample[]>;
    save(example: MusicalExample): Promise<void>;
    delete(id: MusicalExampleId): Promise<void>;
}
