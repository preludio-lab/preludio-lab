import { describe, it, expect } from 'vitest';
import { ScoreSchema } from './Score';
import { ScoreControlSchema } from './ScoreControl';
import { ScoreMetadataSchema } from './ScoreMetadata';

describe('Score', () => {
    it('control と metadata から Score を構成できること', () => {
        const control = ScoreControlSchema.parse({ id: 'score-id', createdAt: new Date(), updatedAt: new Date() });
        const metadata = ScoreMetadataSchema.parse({ publisherName: { en: 'Henle' } });
        const score = ScoreSchema.parse({ control, metadata });

        expect(score.control).toEqual(control);
        expect(score.metadata).toEqual(metadata);
    });
});
