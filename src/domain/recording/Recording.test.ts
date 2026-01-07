import { describe, it, expect } from 'vitest';
import { Recording } from './Recording';
import { RecordingProvider } from './RecordingSources';

describe('Recording Entity', () => {
    const mockControl = {
        id: 'rec-1',
        workId: 'work-1',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const mockMetadata = {
        performerName: { en: 'Glenn Gould' },
        recordingYear: 1981,
        isRecommended: true,
    };
    const mockSources = {
        items: [
            {
                id: 'src-1',
                provider: RecordingProvider.YOUTUBE,
                sourceId: 'id',
            },
        ],
    };

    it('initializes correctly and provides shortcuts', () => {
        const recording = new Recording({
            control: mockControl,
            metadata: mockMetadata,
            sources: mockSources,
        });

        expect(recording.id).toBe('rec-1');
        expect(recording.workId).toBe('work-1');
        expect(recording.performerName.en).toBe('Glenn Gould');
        expect(recording.recordingYear).toBe(1981);
        expect(recording.isRecommended).toBe(true);
        expect(recording.sourceItems).toHaveLength(1);
    });

    it('clones with new values immutably', () => {
        const recording = new Recording({
            control: mockControl,
            metadata: mockMetadata,
            sources: mockSources,
        });

        const updated = recording.cloneWith({
            metadata: { recordingYear: 1955 },
        });

        // Original should be unchanged
        expect(recording.recordingYear).toBe(1981);

        // Updated should reflect change
        expect(updated.recordingYear).toBe(1955);
        // Other fields should remain
        expect(updated.performerName.en).toBe('Glenn Gould');
        expect(updated.id).toBe('rec-1');
    });
});

