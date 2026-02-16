import { describe, it, expect } from 'vitest';
import { PhraseSchema } from './phrase';
import { PhraseId, PhraseControlSchema } from './phrase.control';
import { PhraseMetadataSchema, NotationFormat } from './phrase.metadata';
import { WorkId } from '../work/work';

describe('Phrase', () => {
  it('Phrase を正しく構成できること', () => {
    const control = PhraseControlSchema.parse({
      id: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a3' as PhraseId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const metadata = PhraseMetadataSchema.parse({
      workId: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a4' as WorkId,
      slug: 'theme',
      format: NotationFormat.ABC,
      notationPath: 'test.abc',
    });
    const samples = [
      {
        recordingSourceId: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a5',
        startSeconds: 0,
        endSeconds: 10,
        isDefault: true,
      },
    ];
    const phrase = PhraseSchema.parse({ control, metadata, samples });

    expect(phrase.control).toEqual(control);
    expect(phrase.metadata).toEqual(metadata);
    expect(phrase.samples).toHaveLength(1);
    expect(phrase.samples[0].recordingSourceId).toBe('018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a5');
  });
});
