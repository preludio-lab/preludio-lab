import { describe, it, expect } from 'vitest';
import { ArticleContextSchema } from './ArticleContext';
import { ArticleCategory } from './ArticleMetadata';

describe('ArticleContextSchema', () => {
    it('should allow empty context lists by default', () => {
        const result = ArticleContextSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.seriesAssignments).toEqual([]);
            expect(result.data.relatedArticles).toEqual([]);
        }
    });

    it('should fail if series order is too high', () => {
        const result = ArticleContextSchema.safeParse({
            seriesAssignments: [{
                seriesId: 'uuid',
                seriesSlug: 'slug',
                seriesTitle: 'Title',
                order: 10000,
            }]
        });
        expect(result.success).toBe(false);
    });

    it('should fail if related article title is too long', () => {
        const result = ArticleContextSchema.safeParse({
            relatedArticles: [{
                articleId: 'id',
                title: 'a'.repeat(51),
                category: ArticleCategory.WORKS,
                slug: 'slug',
            }]
        });
        expect(result.success).toBe(false);
    });

    it('should fail if there are too many related articles', () => {
        const tooManyArticles = Array(21).fill({
            articleId: 'id',
            title: 'Title',
            category: ArticleCategory.WORKS,
            slug: 'slug',
        });
        const result = ArticleContextSchema.safeParse({
            relatedArticles: tooManyArticles,
        });
        expect(result.success).toBe(false);
    });
});
