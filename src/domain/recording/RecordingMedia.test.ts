import { describe, it, expect } from 'vitest';
import { RecordingMediaSchema } from './RecordingMedia';
import { RecordingProvider } from './RecordingConstants';

describe('RecordingMedia', () => {
    const validSource = {
        id: 'source-1',
        provider: RecordingProvider.YOUTUBE,
        externalSourceId: 'dQw4w9WgXcQ',
    };

    it('validates valid media with sources', () => {
        const validData = {
            sources: [validSource],
        };
        const result = RecordingMediaSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('fails when sources exceed 50 items', () => {
        const sources = Array(51).fill(validSource);
        const invalidData = { sources };
        const result = RecordingMediaSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it('validates empty sources', () => {
        const validData = { sources: [] };
        const result = RecordingMediaSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });
});
