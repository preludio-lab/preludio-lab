import { AppLocale } from '@/domain/i18n/Locale';
import { Article } from '@/domain/article/Article';
import { ArticleStatus } from '@/domain/article/ArticleControl';
import { ArticleCategory, ArticleMetadata } from '@/domain/article/ArticleMetadata';
import { articles, articleTranslations } from '../database/schema';
import { InferSelectModel } from 'drizzle-orm';

// Drizzle Result Type
type ArticleRow = InferSelectModel<typeof articles>;
type TranslationRow = InferSelectModel<typeof articleTranslations>;

export class ArticleMapper {
  static toDomain(
    articleRow: ArticleRow,
    translationRow: TranslationRow,
    mdxContent: string,
  ): Article {
    // 1. Control
    const control = {
      id: articleRow.id,
      lang: translationRow.lang as AppLocale,
      status: translationRow.status as ArticleStatus,
      createdAt: new Date(articleRow.createdAt),
      updatedAt: new Date(translationRow.updatedAt),
      version: 1, // Default
    };

    // 2. Metadata
    // Note: translationRow.metadata is typed as ArticleMetadata in schema, but might be JSON in runtime.
    // Drizzle handles JSON parsing if 'mode: json' is set.
    // We merge non-normalized snapshots and specific fields into domain metadata.

    // DB stores 'slGenre' etc. separately. Domain Metadata aggregates them.
    // We need to ensure types match ArticleMetadata interface.
    // For now we assume the basic structure.

    // Resolve Category from Metadata or defaults?
    // Since 'category' is not explicitly in articles table in the new schema (it might be in tags?),
    // we might need to derive it or it should be in metadata json.
    // Assuming 'metadata.category' exists or validation rules apply.
    // Falls back to 'WORK' if unknown for now (or strictly checked).

    const baseMetadata = translationRow.metadata || {};

    const metadata = {
      ...baseMetadata,
      slug: articleRow.slug,
      title: translationRow.title,
      // Map other fields
      category: (baseMetadata.category as ArticleCategory) || 'WORK', // Temporary fallback
      tags: baseMetadata.tags || [],
      publishedAt: translationRow.publishedAt ? new Date(translationRow.publishedAt) : undefined,
      isFeatured: articleRow.isFeatured || translationRow.isFeatured,
    };

    // 3. Content
    // contentStructure is managed in DB
    const content = {
      body: mdxContent,
      structure: translationRow.contentStructure || [],
    };

    // 4. Context
    const context = {
      seriesAssignments: translationRow.slSeriesAssignments || [],
      relatedArticles: [], // Populated by separate query or UseCase if needed
      sourceAttributions: [],
      monetizationElements: [],
    };

    // 5. Engagement (Placeholder for now)
    const engagement = undefined;

    return new Article({
      control,
      metadata: metadata as ArticleMetadata,
      content,
      context,
      engagement,
    });
  }
}
