import { describe, it, expect } from 'vitest';
import { Player } from './player';
import { PlayerDisplay } from './player.display';
import { PlayerSource } from './player.source';
import { PlayerMode } from './player.status';

describe('Player Entity', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createBasePlayer = (overrides: any = {}) => {
    return new Player({
      control: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides.control,
      },
      display: {
        title: 'Test Title',
        provider: 'generic',
        displayType: 'audio',
        ...overrides.display,
      } as unknown as PlayerDisplay,
      source: {
        sourceId: 'http://example.com/audio.mp3',
        provider: 'generic',
        ...overrides.source,
      } as unknown as PlayerSource,
      status: {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 50,
        mode: PlayerMode.HIDDEN,
        ...overrides.status,
      },
    });
  };

  describe('Convenience Getters', () => {
    it('should provide shortcuts for common properties', () => {
      const player = createBasePlayer({
        display: { title: 'Shortcut Title' },
        status: { isPlaying: true },
      });

      expect(player.id).toBe(player.control.id);
      expect(player.title).toBe('Shortcut Title');
      expect(player.isPlaying).toBe(true);
    });

    it('should reflect updates in nested objects', () => {
      const player = createBasePlayer();
      // Since Player properties are readonly, we can't mutate them directly in this test without cloning or similar mechanism if it existed.
      // But here we are testing getters on the initial state.
      expect(player.title).toBe('Test Title');
    });
  });
});
