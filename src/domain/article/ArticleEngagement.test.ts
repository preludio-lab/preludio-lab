import { describe, it, expect } from 'vitest';
import { EngagementMetricsSchema } from './ArticleEngagement';

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

    it('should fail if resonanceCount exceeds 1000', () => {
        const result = EngagementMetricsSchema.safeParse({
            ...validMetrics,
            resonanceCount: 1001,
        });
        expect(result.success).toBe(false);
    });

    it('should fail if totalRevenue exceeds 10 million', () => {
        const result = EngagementMetricsSchema.safeParse({
            ...validMetrics,
            totalRevenue: 10000001,
        });
        expect(result.success).toBe(false);
    });
});
