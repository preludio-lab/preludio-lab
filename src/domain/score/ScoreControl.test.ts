import { describe, it, expect } from 'vitest';
import { createScoreControl } from './ScoreControl';

describe('ScoreControl', () => {
    it('should create ScoreControl with provided values', () => {
        const id = 'score-id-123';
        const workId = 'work-id-456';
        const now = new Date();
        const control = createScoreControl(id, workId, now, now);

        expect(control.id).toBe(id);
        expect(control.workId).toBe(workId);
        expect(control.createdAt).toBe(now);
        expect(control.updatedAt).toBe(now);
    });

    it('should set default dates if not provided', () => {
        const control = createScoreControl('id', 'work-id');
        expect(control.createdAt).toBeInstanceOf(Date);
        expect(control.updatedAt).toBeInstanceOf(Date);
    });
});
