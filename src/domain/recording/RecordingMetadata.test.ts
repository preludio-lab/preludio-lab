import { describe, it, expect } from 'vitest';
import { RecordingMetadataSchema } from './RecordingMetadata';

describe('RecordingMetadata', () => {
    it('validates valid metadata', () => {
        const validData = {
            performerName: { en: 'Glenn Gould' },
            recordingYear: 1981,
            isRecommended: true,
        };
        const result = RecordingMetadataSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('fails when recordingYear is below 1800', () => {
        const invalidData = {
            performerName: { en: 'Too Early' },
            recordingYear: 1799,
            isRecommended: false,
        };
        const result = RecordingMetadataSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it('fails when recordingYear is above 2999', () => {
        const invalidData = {
            performerName: { en: 'Future' },
            recordingYear: 3000,
            isRecommended: false,
        };
        const result = RecordingMetadataSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});
