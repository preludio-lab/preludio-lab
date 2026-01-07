import { describe, it, expect } from 'vitest';
import { RecordingSourcesSchema, RecordingProvider, RecordingAudioQuality } from './RecordingSources';

describe('RecordingSources', () => {
    const validSource = {
        id: 'source-1',
        provider: RecordingProvider.YOUTUBE,
        sourceId: 'dQw4w9WgXcQ',
        quality: RecordingAudioQuality.HIGH,
    };

    it('validates valid sources items', () => {
        const validData = {
            items: [validSource],
        };
        const result = RecordingSourcesSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('fails when items exceed 50 items', () => {
        const items = Array(51).fill(validSource);
        const invalidData = { items };
        const result = RecordingSourcesSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it('validates empty items', () => {
        const validData = { items: [] };
        const result = RecordingSourcesSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('validates different providers including local file', () => {
        const localSource = {
            id: 'source-local',
            provider: RecordingProvider.LOCAL_FILE,
            sourceId: 'path/to/audio.wav',
            quality: RecordingAudioQuality.LOSSLESS,
        };
        const result = RecordingSourcesSchema.safeParse({ items: [localSource] });
        expect(result.success).toBe(true);
    });
});
