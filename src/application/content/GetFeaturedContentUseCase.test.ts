import { describe, it, expect, vi } from 'vitest';
import { GetFeaturedContentUseCase, FeaturedCriteria } from './GetFeaturedContentUseCase';
import { IContentRepository } from '@/domain/content/ContentRepository';
import { ContentSummary } from '@/domain/content/Content';

// Mock Repository
const mockRepo = {
    getContentSummariesByCategory: vi.fn(),
    getLatestContentSummariesByCategory: vi.fn(),
    getLatestContentSummaries: vi.fn(), // Global
    getContentDetailBySlug: vi.fn(),
} as unknown as IContentRepository;

describe('GetFeaturedContentUseCase', () => {
    it('should return the latest contents limited by count', async () => {
        const useCase = new GetFeaturedContentUseCase(mockRepo);

        // Mock return values
        // Note: The UseCase now calls the global getLatestContentSummaries
        vi.spyOn(mockRepo, 'getLatestContentSummaries').mockImplementation(async (lang, limit) => {
            // Simulate the repo returning sorted mixed content
            return [
                { slug: 'comp1', metadata: { title: 'New Composer', date: '2024-01-01' } },
                { slug: 'work2', metadata: { title: 'Mid Work', date: '2023-06-01' } },
            ] as ContentSummary[];
        });

        // Request top 2 items
        const result = await useCase.execute({
            lang: 'ja',
            criteria: FeaturedCriteria.LATEST,
            limit: 2
        });

        expect(result).toHaveLength(2);
        expect(mockRepo.getLatestContentSummaries).toHaveBeenCalledWith('ja', 2);
        // 1. New Composer (2024-01-01)
        expect(result[0].metadata.title).toBe('New Composer');
        // 2. Mid Work (2023-06-01)
        expect(result[1].metadata.title).toBe('Mid Work');
    });

    it('should return empty array if no content exists', async () => {
        const useCase = new GetFeaturedContentUseCase(mockRepo);
        vi.spyOn(mockRepo, 'getLatestContentSummaries').mockResolvedValue([]);

        const result = await useCase.execute({ lang: 'ja' });

        expect(result).toEqual([]);
    });

    it('should use default limit of 3 if not specified', async () => {
        const useCase = new GetFeaturedContentUseCase(mockRepo);
        // Reset mock to ensure call count is correct
        vi.mocked(mockRepo.getLatestContentSummaries).mockClear();
        vi.spyOn(mockRepo, 'getLatestContentSummaries').mockResolvedValue([
            { metadata: { date: '2024' } },
            { metadata: { date: '2023' } },
            { metadata: { date: '2022' } }
        ] as ContentSummary[]);

        const result = await useCase.execute({ lang: 'ja' });

        // Verify that the repository was called with the default limit (3)
        expect(mockRepo.getLatestContentSummaries).toHaveBeenCalledWith('ja', 3);
        expect(result).toHaveLength(3);
    });
});
