import { describe, it, expect } from 'vitest';
import { ArticleMetadataSchema, ArticleCategory } from './ArticleMetadata';
import { ArticleControlSchema, ArticleStatus } from './ArticleControl';
import { ArticleContentSchema } from './ArticleContent';
import { ArticleContextSchema } from './ArticleContext';
import { EngagementMetricsSchema } from './ArticleEngagement';

describe('Domain Module Schemas', () => {
    describe('ArticleMetadataSchema', () => {
        const validMetadata = {
            title: 'Test Title',
            displayTitle: 'Display Title',
            slug: 'test-slug',
            category: ArticleCategory.WORKS,
            composerName: 'Beethoven',
            readingLevel: 3,
            performanceDifficulty: 3,
            isFeatured: false,
            readingTimeSeconds: 120,
            tags: ['classic', 'piano'],
            publishedAt: new Date(),
        };

        it('should validate correct metadata', () => {
            const result = ArticleMetadataSchema.safeParse(validMetadata);
            expect(result.success).toBe(true);
        });

        it('should fail if readingLevel is out of range', () => {
            const result = ArticleMetadataSchema.safeParse({
                ...validMetadata,
                readingLevel: 6,
            });
            expect(result.success).toBe(false);
        });

        it('should fail if performanceDifficulty is below 1', () => {
            const result = ArticleMetadataSchema.safeParse({
                ...validMetadata,
                performanceDifficulty: 0,
            });
            expect(result.success).toBe(false);
        });

        it('should fail if slug contains invalid characters', () => {
            const result = ArticleMetadataSchema.safeParse({
                ...validMetadata,
                slug: 'Test_Slug_123', // Upper case and underscore
            });
            expect(result.success).toBe(false);
        });

        it('should fail if title is too long', () => {
            const result = ArticleMetadataSchema.safeParse({
                ...validMetadata,
                title: 'a'.repeat(101),
            });
            expect(result.success).toBe(false);
        });

        it('should allow hierarchical slugs with slashes', () => {
            const result = ArticleMetadataSchema.safeParse({
                ...validMetadata,
                slug: 'beethoven/symphony-no5',
            });
            expect(result.success).toBe(true);
        });

        it('should fail if slug has leading or trailing slashes', () => {
            expect(ArticleMetadataSchema.safeParse({ ...validMetadata, slug: '/a' }).success).toBe(false);
            expect(ArticleMetadataSchema.safeParse({ ...validMetadata, slug: 'a/' }).success).toBe(false);
            expect(ArticleMetadataSchema.safeParse({ ...validMetadata, slug: 'a//b' }).success).toBe(false);
        });

        it('should fail if slug is longer than 64 characters', () => {
            const result = ArticleMetadataSchema.safeParse({
                ...validMetadata,
                slug: 'a'.repeat(65),
            });
            expect(result.success).toBe(false);
        });

        it('should fail if compositionYear is out of range', () => {
            const result = ArticleMetadataSchema.safeParse({
                ...validMetadata,
                compositionYear: 999,
            });
            expect(result.success).toBe(false);
        });

        it('should fail if readingTimeSeconds exceeds 1800', () => {
            const result = ArticleMetadataSchema.safeParse({
                ...validMetadata,
                readingTimeSeconds: 1801,
            });
            expect(result.success).toBe(false);
        });
    });

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
                id: 'a'.repeat(101),
                lang: 'ja',
                status: ArticleStatus.PUBLISHED,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            expect(result.success).toBe(false);
        });
    });

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
    });

    describe('ArticleContextSchema', () => {
        it('should allow empty context lists by default', () => {
            const result = ArticleContextSchema.safeParse({});
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.seriesAssignments).toEqual([]);
                expect(result.data.relatedArticles).toEqual([]);
            }
        });
    });

    describe('EngagementMetricsSchema', () => {
        const validMetrics = {
            viewCount: 100,
            auditionCount: 50,
            likeCount: 10,
            resonanceCount: 5,
            shareCount: 2,
            affiliateClickCount: 0,
            conversionCount: 0,
            totalRevenue: 0,
            totalTimeOnPageSeconds: 3600,
        };

        it('should validate non-negative numbers', () => {
            const result = EngagementMetricsSchema.safeParse(validMetrics);
            expect(result.success).toBe(true);
        });

        it('should fail on negative values', () => {
            const result = EngagementMetricsSchema.safeParse({
                ...validMetrics,
                viewCount: -1,
            });
            expect(result.success).toBe(false);
        });

        it('should fail if viewCount exceeds 1 billion', () => {
            const result = EngagementMetricsSchema.safeParse({
                ...validMetrics,
                viewCount: 1000000001,
            });
            expect(result.success).toBe(false);
        });
    });
});
