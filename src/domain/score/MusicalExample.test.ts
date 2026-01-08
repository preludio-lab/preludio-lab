import { describe, it, expect } from 'vitest';
import { MusicalExampleSchema } from './MusicalExample';
import { MusicalExampleControlSchema } from './MusicalExampleControl';
import { MusicalExampleMetadataSchema, NotationFormat } from './MusicalExampleMetadata';
import { MusicalExampleBindingSchema } from './MusicalExampleBinding';

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
        const binding = MusicalExampleBindingSchema.parse({ playbackBindings: [] });
        const example = MusicalExampleSchema.parse({ control, metadata, binding });

        expect(example.control).toEqual(control);
        expect(example.metadata).toEqual(metadata);
        expect(example.binding).toEqual(binding);
    });
});
