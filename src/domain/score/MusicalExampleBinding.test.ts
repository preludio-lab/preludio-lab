import { describe, it, expect } from 'vitest';
import { createMusicalExampleBinding } from './MusicalExampleBinding';

describe('MusicalExampleBinding', () => {
    it('PlaybackBinding を持つ MusicalExampleBinding を作成できること', () => {
        const binding = createMusicalExampleBinding([
            {
                recordingSourceId: 'src-1',
                startSeconds: 10,
                endSeconds: 20,
                isDefault: true,
            },
        ]);

        expect(binding.playbackBindings).toHaveLength(1);
        expect(binding.playbackBindings[0].recordingSourceId).toBe('src-1');
    });

    it('デフォルトでバインディングが空配列であること', () => {
        const binding = createMusicalExampleBinding();
        expect(binding.playbackBindings).toEqual([]);
    });
});
