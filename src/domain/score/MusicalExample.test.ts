import { describe, it, expect } from 'vitest';
import { createMusicalExample } from './MusicalExample';
import { createMusicalExampleControl } from './MusicalExampleControl';
import { createMusicalExampleMetadata } from './MusicalExampleMetadata';
import { createMusicalExampleBinding } from './MusicalExampleBinding';
import { ScoreFormat } from './ScoreFormat';

describe('MusicalExample', () => {
    it('MusicalExample を正しく構成できること', () => {
        const control = createMusicalExampleControl('ex-1', 'art-1');
        const metadata = createMusicalExampleMetadata({
            workId: 'work-1',
            slug: 'theme',
            format: ScoreFormat.ABC,
            data: 'X:1\nK:C\nC',
        });
        const binding = createMusicalExampleBinding();
        const example = createMusicalExample(control, metadata, binding);

        // Zod.parse() を通ると新しいオブジェクトになるため toEqual を使用
        expect(example.control).toEqual(control);
        expect(example.metadata).toEqual(metadata);
        expect(example.binding).toEqual(binding);
    });
});
