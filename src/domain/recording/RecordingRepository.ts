import { Recording } from './Recording';

/**
 * Recording Repository
 * 録音データの永続化・検索を担当するインターフェース
 */
export interface RecordingRepository {
    /**
     * Find a single recording by ID
     */
    findById(id: string): Promise<Recording | null>;

    /**
     * Find recordings by Work ID
     */
    findByWorkId(workId: string): Promise<Recording[]>;

    /**
     * Management Methods (CUD)
     * Create / Update
     */
    save(recording: Recording): Promise<void>;

    /**
     * Delete
     */
    delete(id: string): Promise<void>;
}
