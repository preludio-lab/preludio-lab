import { describe, it, expect } from 'vitest';
import { createScore } from './Score';
import { createScoreControl } from './ScoreControl';
import { createScoreMetadata } from './ScoreMetadata';

describe('Score', () => {
    it('control と metadata から Score を構成できること', () => {
        const control = createScoreControl('score-id');
        const metadata = createScoreMetadata({ publisherName: 'Henle' });
        const score = createScore(control, metadata);

        // Zod.parse() を通ると新しいオブジェクトになるため toEqual を使用
        expect(score.control).toEqual(control);
        expect(score.metadata).toEqual(metadata);
    });
});
