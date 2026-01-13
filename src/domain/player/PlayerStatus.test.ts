import { describe, it, expect } from 'vitest';
import { PlayerStatusSchema, PlayerMode } from './PlayerStatus';

describe('PlayerStatus', () => {
  describe('Schema Validation', () => {
    it('should validate valid status data', () => {
      const validData = {
        isPlaying: true,
        currentTime: 10,
        duration: 300,
        volume: 75,
        mode: PlayerMode.MINI,
      };
      const result = PlayerStatusSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should set default values', () => {
      const emptyData = {};
      const result = PlayerStatusSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPlaying).toBe(false);
        expect(result.data.currentTime).toBe(0);
        expect(result.data.volume).toBe(50);
        expect(result.data.mode).toBe(PlayerMode.HIDDEN);
      }
    });

    it('should validate volume range (0-100)', () => {
      expect(PlayerStatusSchema.safeParse({ volume: -1 }).success).toBe(false);
      expect(PlayerStatusSchema.safeParse({ volume: 101 }).success).toBe(false);
      expect(PlayerStatusSchema.safeParse({ volume: 0 }).success).toBe(true);
      expect(PlayerStatusSchema.safeParse({ volume: 100 }).success).toBe(true);
    });
  });
});
