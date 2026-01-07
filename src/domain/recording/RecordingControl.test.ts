import { describe, it, expect } from 'vitest';
import { RecordingControlSchema } from './RecordingControl';

describe('RecordingControl', () => {
    it('validates a valid control object', () => {
        const validData = {
            id: '018b0a1a-2b3c-7d4e-5f6g-7h8i9j0k1l2m',
            workId: '018b0a1a-2b3c-7d4e-5f6g-7h8i9j0k1l2n',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = RecordingControlSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('fails when ID exceeds 50 characters', () => {
        const invalidData = {
            id: 'a'.repeat(51),
            workId: 'some-work-id',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = RecordingControlSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it('fails when workId exceeds 50 characters', () => {
        const invalidData = {
            id: 'some-id',
            workId: 'a'.repeat(51),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = RecordingControlSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});
