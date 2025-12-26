import { describe, it, expect, vi } from 'vitest';
import { GetCategoryContentsUseCase, GetCategoryContentsInput } from './GetCategoryContentsUseCase';
import { IContentRepository, ContentFilterCriteria } from '@/domain/content/ContentRepository';
import { ContentSummary } from '@/domain/content/Content';
import { ContentSortOption } from '@/domain/content/ContentConstants';

describe('GetCategoryContentsUseCase', () => {
    // Mock Repository
    const mockRepo = {
        getContentDetailBySlug: vi.fn(),
        findSummariesByCriteria: vi.fn(),
        getContentSummariesByCategory: vi.fn(),
        getLatestContentSummariesByCategory: vi.fn(),
        getLatestContentSummaries: vi.fn(),
    } as unknown as IContentRepository;

    const useCase = new GetCategoryContentsUseCase(mockRepo);

    it('should call repository with correct criteria defined in input', async () => {
        const input: GetCategoryContentsInput = {
            lang: 'en',
            category: 'works',
            difficulty: 'Advanced',
            keyword: 'Bach',
            sort: ContentSortOption.TITLE,
            tags: ['piano'],
        };

        const expectedResult: ContentSummary[] = [{ slug: 'test' } as any];
        vi.mocked(mockRepo.findSummariesByCriteria).mockResolvedValue(expectedResult);

        const result = await useCase.execute(input);

        const expectedCriteria: ContentFilterCriteria = {
            lang: 'en',
            category: 'works',
            difficulty: 'Advanced',
            keyword: 'Bach',
            sort: ContentSortOption.TITLE,
            tags: ['piano'],
        };

        expect(mockRepo.findSummariesByCriteria).toHaveBeenCalledWith(expectedCriteria);
        expect(result).toEqual(expectedResult);
    });

    it('should use default sort "latest" if not provided', async () => {
        const input: GetCategoryContentsInput = {
            lang: 'jp',
            category: 'theory',
        };

        vi.mocked(mockRepo.findSummariesByCriteria).mockResolvedValue([]);

        await useCase.execute(input);

        const expectedCriteria: ContentFilterCriteria = {
            lang: 'jp',
            category: 'theory',
            difficulty: undefined,
            keyword: undefined,
            sort: 'latest', // Default
            tags: undefined,
        };

        expect(mockRepo.findSummariesByCriteria).toHaveBeenCalledWith(expectedCriteria);
    });
});
