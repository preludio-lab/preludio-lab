import { describe, it, expect } from 'vitest';
import { ArticleContentSchema } from './ArticleContent';

describe('ArticleContentSchema', () => {
    it('should validate body and structure', () => {
        const result = ArticleContentSchema.safeParse({
            body: '# Main Content',
            structure: [
                { id: 'sec-1', heading: 'Section 1', level: 2, children: [] }
            ],
        });
        expect(result.success).toBe(true);
    });

    it('should fail if body is excessively long', () => {
        const result = ArticleContentSchema.safeParse({
            body: 'a'.repeat(100001),
            structure: [],
        });
        expect(result.success).toBe(false);
    });

    it('should fail if heading is too long', () => {
        const result = ArticleContentSchema.safeParse({
            body: '# Title',
            structure: [{ id: 'sec', heading: 'a'.repeat(51), level: 2 }],
        });
        expect(result.success).toBe(false);
    });
});
