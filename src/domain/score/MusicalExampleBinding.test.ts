import { describe, it, expect } from 'vitest';
import { MusicalExampleBindingSchema } from './MusicalExampleBinding';

describe('MusicalExampleBinding', () => {
    it('PlaybackBinding を持つ MusicalExampleBinding を作成できること', () => {
        const data = {
            playbackBindings: [
                {
                    recordingSourceId: 'src-1',
                    startSeconds: 10,
                    endSeconds: 20,
                    isDefault: true,
                },
            ]
        };
        const binding = MusicalExampleBindingSchema.parse(data);

        expect(binding.playbackBindings).toHaveLength(1);
        expect(binding.playbackBindings[0].recordingSourceId).toBe('src-1');
    });

    it('デフォルトでバインディングが空配列であること', () => {
        const binding = MusicalExampleBindingSchema.parse({});
        expect(binding.playbackBindings).toEqual([]);
    });
});
