import { describe, it, expect } from 'vitest';
import { generateId } from './id';

describe('ID Generation (UUIDv7)', () => {
  it('should generate a valid UUID format', () => {
    const id = generateId<'Test'>();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidRegex);
  });

  it('should not have collisions in 1000 generations', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const id = generateId<'Test'>();
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
    expect(ids.size).toBe(1000);
  });

  it('should be sortable by generation time', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 10; i++) {
      ids.push(generateId<'Test'>());
      // Small delay to ensure timestamp progression if needed,
      // though UUIDv7 should handle sub-millisecond if implemented correctly.
      await new Promise((resolve) => setTimeout(resolve, 2));
    }

    const sortedIds = [...ids].sort();
    expect(ids).toEqual(sortedIds);
  });

  it('should have correct UUID version (7)', () => {
    const id = generateId<'Test'>();
    // The 13th character (at index 14 including hyphens) indicates the version.
    // Index: 01234567 8 9012 3 4567...
    //        xxxxxxxx-xxxx-Vxxx-...
    expect(id.charAt(14)).toBe('7');
  });
});
