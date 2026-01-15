import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/ArticleRepository';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { Article } from '@/domain/article/Article';
import { PagedResponse } from '@/domain/shared/Pagination';
import { ArticleMetadataDataSource } from './metadata.ds';
import { ArticleContentDataSource } from './content.ds';
import { ArticleMapper } from './mapper';

export class ArticleRepositoryImpl implements ArticleRepository {
  constructor(
    private metadataDS: ArticleMetadataDataSource,
    private contentDS: ArticleContentDataSource,
  ) { }

  async findById(_id: string): Promise<Article | null> {
    // For ID lookup, we might need language context?
    // ArticleRepository interface's findById usually implies fetching for a specific context or returning a default lang?
    // In this system, Article Entity is localized. So we probably need Lang.
    // However, the interface definition `findById(id: string)` doesn't take lang.
    // This implies either ID is unique per translation (it is in article_translations),
    // OR we need to change/clarify the interface.
    //
    // Looking at schema: `article_translations.id` is PK.
    // If the Domain `Article.id` corresponds to `articles.id` (Universal ID), then findById is ambiguous without lang.
    // If Domain `Article.id` corresponds to `article_translations.id`, it is unique.

    // Assumption: We usually access by Slug + Lang.
    // For findById, let's assume valid ID refers to Universal ID and we default to 'en' or fetch all?
    // Actually, clean architecture wise, Repository should probably handle this.
    // Let's defer findById implementation details or throw generic error if not supported yet,
    // but looking at `metadata.ds.ts`, I implemented `findById(id, lang)`.

    // For now, let's fetch 'en' default if not specified or just fail?
    // Or maybe the ID passed here IS the translation ID?
    // Let's assume Universal ID and default lang 'ja' for local dev context if unsure,
    // but better to stick to findBySlug for main use case.

    return null; // Not implemented strictly yet as it requires Lang context.
  }

  async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
    // 1. Fetch Metadata
    const row = await this.metadataDS.findBySlug(slug, lang);
    if (!row) return null;

    // 2. Fetch Content (MDX)
    let content = '';
    if (row.article_translations.mdxPath) {
      content = await this.contentDS.getContent(row.article_translations.mdxPath);
    }

    // 3. Map to Domain
    return ArticleMapper.toDomain(row.articles, row.article_translations, content);
  }

  async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
    // Implementation for list view
    return {
      items: [],
      totalCount: 0,
      hasNextPage: false,
    };
  }

  async save(_article: Article): Promise<void> {
    // Read-only implementation for now
    throw new Error('Method not implemented.');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
