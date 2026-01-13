import { describe, it, expect } from 'vitest';
import { PlayerControlSchema } from './PlayerControl';

describe('PlayerControl', () => {
  describe('Schema Validation', () => {
    it('should validate valid control data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = PlayerControlSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should set default values for createdAt and updatedAt', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };
      const result = PlayerControlSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should fail if id is not a UUID', () => {
      const invalidData = {
        id: 'not-a-uuid',
      };
      const result = PlayerControlSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message.toLowerCase()).toContain('uuid');
      }
    });
  });
});
