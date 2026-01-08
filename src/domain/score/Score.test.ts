import { describe, it, expect } from 'vitest';
import { createScore } from './Score';
import { createScoreControl } from './ScoreControl';
import { createScoreMetadata } from './ScoreMetadata';

describe('Score', () => {
    it('should compose Score with control and metadata', () => {
        const control = createScoreControl('score-id', 'work-id');
        const metadata = createScoreMetadata({ publisherName: 'Henle' });
        const score = createScore(control, metadata);

        expect(score.control).toBe(control);
        expect(score.metadata).toBe(metadata);
    });
});
