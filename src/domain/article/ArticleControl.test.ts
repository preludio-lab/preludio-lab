import { describe, it, expect } from 'vitest';
import { ArticleControlSchema, ArticleStatus } from './ArticleControl';

describe('ArticleControlSchema', () => {
    it('should validate correct control data', () => {
        const result = ArticleControlSchema.safeParse({
            id: 'uuid-123',
            lang: 'ja',
            status: ArticleStatus.PUBLISHED,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        expect(result.success).toBe(true);
    });

    it('should fail on invalid status', () => {
        const result = ArticleControlSchema.safeParse({
            id: 'uuid-123',
            lang: 'ja',
            status: 'INVALID_STATUS',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        expect(result.success).toBe(false);
    });

    it('should fail if id is too long', () => {
        const result = ArticleControlSchema.safeParse({
            id: 'a'.repeat(51),
            lang: 'ja',
            status: ArticleStatus.PUBLISHED,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        expect(result.success).toBe(false);
    });

    it('should fail if lang is too long', () => {
        const result = ArticleControlSchema.safeParse({
            id: 'uuid-123',
            lang: 'too-long-lang-code',
            status: ArticleStatus.PUBLISHED,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        expect(result.success).toBe(false);
    });
});
