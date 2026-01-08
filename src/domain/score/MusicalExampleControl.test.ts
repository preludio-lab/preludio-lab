import { describe, it, expect } from 'vitest';
import { MusicalExampleControlSchema } from './MusicalExampleControl';

describe('MusicalExampleControl', () => {
    it('MusicalExampleControl を作成できること', () => {
        const data = {
            id: 'ex-id-1',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const control = MusicalExampleControlSchema.parse(data);

        expect(control.id).toBe(data.id);
    });
});
