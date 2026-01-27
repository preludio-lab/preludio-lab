import { describe, it, expect } from 'vitest';
import { MusicalExampleSchema } from './musical-example';
import { MusicalExampleId, MusicalExampleControlSchema } from './musical-example.control';
import { MusicalExampleMetadataSchema, NotationFormat } from './musical-example.metadata';
import { WorkId } from '../work/work';

describe('MusicalExample', () => {
  it('MusicalExample を正しく構成できること', () => {
    const control = MusicalExampleControlSchema.parse({
      id: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a3' as MusicalExampleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const metadata = MusicalExampleMetadataSchema.parse({
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
    const example = MusicalExampleSchema.parse({ control, metadata, samples });

    expect(example.control).toEqual(control);
    expect(example.metadata).toEqual(metadata);
    expect(example.samples).toHaveLength(1);
    expect(example.samples[0].recordingSourceId).toBe('018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a5');
  });
});
