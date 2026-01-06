import { ArticleRepository } from '@/domain/article/ArticleRepository';
import { ArticleSearchResultDto } from '@/application/article/dto/ArticleDto';
import { PagedResponse } from '@/domain/shared/Pagination';
import { Article } from '@/domain/article/Article';
import { ArticleStatus } from '@/domain/article/ArticleControl';
import { SearchArticlesUseCase } from './SearchArticlesUseCase';

import { ArticleCategory } from '@/domain/article/ArticleMetadata';

/**
 * GetRelatedArticlesUseCase
 * 関連記事の取得（レコメンデーション）
 */
export class GetRelatedArticlesUseCase {
    constructor(private readonly articleRepository: ArticleRepository) { }

    async execute(lang: string, category: string, baseSlug: string, limit: number = 3): Promise<PagedResponse<ArticleSearchResultDto>> {
        const baseArticle = await this.articleRepository.findBySlug(lang, category as ArticleCategory, baseSlug);
        if (!baseArticle) {
            return { items: [], totalCount: 0, hasNextPage: false };
        }

        // Related Logic for FS:
        // 1. Same composer
        // 2. Same tags
        // 3. Same category

        // We reuse SearchArticlesUseCase to get DTOs
        const searchUseCase = new SearchArticlesUseCase(this.articleRepository);

        // Construct criteria
        // Note: FS Repo findMany creates AND condition for filters.
        // We want OR condition for related articles (e.g. same composer OR same tags).
        // But FS Repo findMany is simplistic.
        // So we invoke multiple searches or just search by minimal strong criteria.

        // Strategy: Search by Tag (if available) or Category.
        // Ideally specialized method in Repository or multiple queries.
        // For FS MVP: Search by Tags.

        let items: ArticleSearchResultDto[] = [];

        if (baseArticle.metadata.tags.length > 0) {
            const result = await searchUseCase.execute({
                lang,
                status: [ArticleStatus.PUBLISHED],
                tags: [baseArticle.metadata.tags[0]], // Use first tag as primary related key
                limit: limit + 1 // Fetch extra to exclude self
            });
            items = result.items;
        } else {
            // Fallback: Same Category
            const result = await searchUseCase.execute({
                lang,
                status: [ArticleStatus.PUBLISHED],
                category: baseArticle.category,
                limit: limit + 1
            });
            items = result.items;
        }

        // Exclude self
        items = items.filter(a => a.slug !== baseSlug).slice(0, limit);

        return {
            items,
            totalCount: items.length,
            hasNextPage: false
        };
    }
}
