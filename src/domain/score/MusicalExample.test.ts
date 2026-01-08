import { describe, it, expect } from 'vitest';
import { createMusicalExample } from './MusicalExample';
import { createMusicalExampleControl } from './MusicalExampleControl';
import { createMusicalExampleMetadata } from './MusicalExampleMetadata';
import { createMusicalExampleBinding } from './MusicalExampleBinding';
import { ScoreFormat } from './Score';

describe('MusicalExample', () => {
    it('MusicalExample を正しく構成できること', () => {
        const control = createMusicalExampleControl('ex-1', 'art-1');
        const metadata = createMusicalExampleMetadata({
            workId: 'work-1',
            slug: 'theme',
            format: ScoreFormat.ABC,
            data: 'data',
        });
        const binding = createMusicalExampleBinding();
        const example = createMusicalExample(control, metadata, binding);

        expect(example.control).toBe(control);
        expect(example.metadata).toBe(metadata);
        expect(example.binding).toBe(binding);
    });
});
