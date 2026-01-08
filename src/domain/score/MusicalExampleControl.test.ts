import { describe, it, expect } from 'vitest';
import { createMusicalExampleControl } from './MusicalExampleControl';

describe('MusicalExampleControl', () => {
    it('articleId を持つ MusicalExampleControl を作成できること', () => {
        const id = 'ex-id-1';
        const articleId = 'art-id-1';
        const control = createMusicalExampleControl(id, articleId);

        expect(control.id).toBe(id);
        expect(control.articleId).toBe(articleId);
    });
});
