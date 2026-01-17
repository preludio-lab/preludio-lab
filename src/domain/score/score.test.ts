import { describe, it, expect } from 'vitest';
import { ScoreSchema } from './score';
import { ScoreControlSchema } from './score.control';
import { ScoreMetadataSchema } from './score.metadata';

describe('Score', () => {
  it('control と metadata から Score を構成できること', () => {
    const control = ScoreControlSchema.parse({
      id: 'score-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const metadata = ScoreMetadataSchema.parse({ publisherName: { en: 'Henle' } });
    const score = ScoreSchema.parse({ control, metadata });

    expect(score.control).toEqual(control);
    expect(score.metadata).toEqual(metadata);
  });
});
