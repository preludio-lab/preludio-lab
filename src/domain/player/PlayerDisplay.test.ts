import { describe, it, expect } from 'vitest';
import { PlayerDisplaySchema } from './PlayerDisplay';

describe('PlayerDisplay', () => {
  describe('Schema Validation', () => {
    it('should validate valid display data', () => {
      const validData = {
        title: 'Test Title',
        composerName: 'Test Composer',
        performer: 'Test Performer',
        provider: 'generic',
      };
      const result = PlayerDisplaySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate minimum required fields (title)', () => {
      const validData = {
        title: 'Only Title',
      };
      const result = PlayerDisplaySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.provider).toBe('generic');
      }
    });

    it('should fail if title exceeds max length', () => {
      const invalidData = {
        title: 'a'.repeat(101), // Max 100
      };
      const result = PlayerDisplaySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should fail if composerName exceeds max length', () => {
      const invalidData = {
        title: 'Valid Title',
        composerName: 'a'.repeat(51), // Max 50
      };
      const result = PlayerDisplaySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
