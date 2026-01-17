import { describe, it, expect } from 'vitest';
import { PlayerSourceSchema } from './player-source';

describe('PlayerSource', () => {
  describe('Schema Validation', () => {
    it('should validate valid source data', () => {
      const validData = {
        sourceId: 'http://example.com/audio.mp3',
        provider: 'generic',
        startSeconds: 0,
        endSeconds: 60,
      };
      const result = PlayerSourceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if sourceId is missing', () => {
      const invalidData = {
        provider: 'generic',
      };
      const result = PlayerSourceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('sourceId');
      }
    });

    it('should fail if sourceId exceeds max length', () => {
      const invalidData = {
        sourceId: 'a'.repeat(2049), // Max 2048
      };
      const result = PlayerSourceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate time range (endSeconds > startSeconds)', () => {
      const validData = {
        sourceId: 'test',
        startSeconds: 10,
        endSeconds: 100, // Correct
      };
      expect(PlayerSourceSchema.safeParse(validData).success).toBe(true);
    });

    it('should fail if endSeconds <= startSeconds', () => {
      const invalidData = {
        sourceId: 'test',
        startSeconds: 100,
        endSeconds: 50, // Invalid
      };
      const result = PlayerSourceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'endSeconds must be greater than startSeconds',
        );
      }
    });

    it('should allow endSeconds w/o startSeconds (assuming start=0)', () => {
      const validData = {
        sourceId: 'test',
        endSeconds: 10,
      };
      // Logic: endSeconds > (startSeconds ?? 0) => 10 > 0 => True
      expect(PlayerSourceSchema.safeParse(validData).success).toBe(true);
    });

    it('should validate SecondsSchema limits (max 86400)', () => {
      const invalidData = {
        sourceId: 'test',
        startSeconds: 86401, // > 24 hours
      };
      const result = PlayerSourceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
