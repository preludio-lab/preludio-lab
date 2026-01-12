import { describe, it, expect } from 'vitest';
import { MusicalExampleSchema } from './MusicalExample';
import { MusicalExampleControlSchema } from './MusicalExampleControl';
import { MusicalExampleMetadataSchema, NotationFormat } from './MusicalExampleMetadata';

describe('MusicalExample', () => {
  it('MusicalExample を正しく構成できること', () => {
    const control = MusicalExampleControlSchema.parse({
      id: 'ex-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const metadata = MusicalExampleMetadataSchema.parse({
      workId: 'work-1',
      slug: 'theme',
      format: NotationFormat.ABC,
      notationPath: 'test.abc',
    });
    const samples = [
      {
        recordingSourceId: 'src-1',
        startSeconds: 0,
        endSeconds: 10,
        isDefault: true,
      },
    ];
    const example = MusicalExampleSchema.parse({ control, metadata, samples });

    expect(example.control).toEqual(control);
    expect(example.metadata).toEqual(metadata);
    expect(example.samples).toHaveLength(1);
    expect(example.samples[0].recordingSourceId).toBe('src-1');
  });
});
