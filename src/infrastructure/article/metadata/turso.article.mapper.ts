import { AppLocale } from '@/domain/i18n/locale';
import { Article, ArticleId, ArticleSummary } from '@/domain/article/article';
import { ArticleStatus, ArticleControl } from '@/domain/article/article.control';
import {
  ArticleCategory,
  ArticleMetadata,
  ArticleMetadataSchema,
} from '@/domain/article/article.metadata';
import { ArticleContent } from '@/domain/article/article.content';
import { AppError } from '@/domain/shared/app-error';
import { ArticleMetadataRow, ArticleRow, TranslationRow } from './article.metadata.ds.interface';

// Zod Schema for Metadata JSON Validation
const MetadataSchema = ArticleMetadataSchema.partial().passthrough();

export class TursoArticleMapper {
  /**
   * DB行データ（プレーンなインターフェース）からドメインエンティティに変換します。
   */
  static toAggregate(
    articleRow: ArticleRow,
    translationRow: TranslationRow,
    mdxContent?: string | null,
  ): Article {
    const summary = this.toSummary(articleRow, translationRow);

    const content = new ArticleContent({
      body: mdxContent ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      structure: (translationRow.contentStructure as any) || [],
    });

    return new Article({
      control: summary.control,
      metadata: summary.metadata,
      content,
      engagement: summary.engagement,
      context: summary.context,
    });
  }

  /**
   * DB行データからサマリーエンティティに変換します。
   * ペイロード（MDX）を含まないため高速です。
   */
  static toSummary(articleRow: ArticleRow, translationRow: TranslationRow): ArticleSummary {
    const lang = translationRow.lang as AppLocale;

    const rawMetadata = translationRow.metadata || {};
    const parsedMetadataResult = MetadataSchema.safeParse(rawMetadata);

    if (!parsedMetadataResult.success) {
      throw new AppError(
        `Invalid metadata structure for article: ${articleRow.id}`,
        'INTERNAL_SERVER_ERROR',
        500,
        parsedMetadataResult.error,
      );
    }
    const safeBaseMetadata = parsedMetadataResult.data;

    const rawStatus = translationRow.status;
    const status = rawStatus as ArticleStatus;
    if (!Object.values(ArticleStatus).includes(status)) {
      throw new AppError(`Invalid status detected: ${rawStatus}`, 'INTERNAL_SERVER_ERROR', 500);
    }

    const control: ArticleControl = {
      id: articleRow.id as ArticleId,
      lang: lang,
      status: status,
      createdAt: new Date(articleRow.createdAt),
      updatedAt: new Date(translationRow.updatedAt),
    };

    const categoryName = translationRow.slCategory || articleRow.category;
    const category = categoryName as ArticleCategory;
    if (!Object.values(ArticleCategory).includes(category)) {
      throw new AppError(
        `Invalid category detected: ${categoryName}`,
        'INTERNAL_SERVER_ERROR',
        600,
      );
    }

    const slug = translationRow.slSlug || articleRow.slug;

    const metadata: ArticleMetadata = {
      ...safeBaseMetadata,
      slug: slug,
      category: category,
      title: translationRow.title,
      publishedAt: translationRow.publishedAt ? new Date(translationRow.publishedAt) : null,
      isFeatured: articleRow.isFeatured || translationRow.isFeatured || false,
      displayTitle: translationRow.displayTitle,
      readingTimeSeconds: articleRow.readingTimeSeconds,
      composerName: translationRow.slComposerName || safeBaseMetadata.composerName || '',
      thumbnail: articleRow.thumbnailPath || safeBaseMetadata.thumbnail || undefined,
      tags: safeBaseMetadata.tags || [],
    };

    const context = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      seriesAssignments: (translationRow.slSeriesAssignments as any) || [],
      relatedArticles: [],
      sourceAttributions: [],
      monetizationElements: [],
    };

    return new ArticleSummary({
      control,
      metadata,
      context,
    });
  }

  /**
   * ドメインエンティティからDB行データ（プレーンなインターフェース）に変換します。
   */
  static toPersistence(article: Article | ArticleSummary): ArticleMetadataRow {
    const articles: ArticleRow = {
      id: article.id,
      workId: null, // 必要に応じて拡張
      slug: article.slug,
      category: article.category,
      isFeatured: article.isFeatured,
      readingTimeSeconds: article.metadata.readingTimeSeconds || 0,
      thumbnailPath: article.metadata.thumbnail || null,
      createdAt: article.control.createdAt.toISOString(),
      updatedAt: article.control.updatedAt.toISOString(),
    };

    const isFullArticle = article instanceof Article;

    const article_translations: TranslationRow = {
      id: `${article.id}_${article.lang}`, // 仮の合成ID
      articleId: article.id,
      lang: article.lang,
      status: article.status,
      title: article.title,
      displayTitle: article.metadata.displayTitle || article.title,
      catchcopy: article.metadata.catchcopy || null,
      excerpt: article.metadata.excerpt || null,
      publishedAt: article.metadata.publishedAt?.toISOString() || null,
      isFeatured: article.isFeatured,
      slSlug: article.slug,
      slCategory: article.category,
      slComposerName: article.metadata.composerName || null,
      slWorkCatalogueId: null,
      slWorkNicknames: [],
      slGenre: [],
      slInstrumentations: [],
      slEra: null,
      slNationality: null,
      slKey: null,
      slPerformanceDifficulty: null,
      slImpressionDimensions: {},
      slSeriesAssignments: article.context.seriesAssignments,
      metadata: article.metadata,
      contentStructure: isFullArticle ? article.content.structure : [],
      createdAt: article.control.createdAt.toISOString(),
      updatedAt: article.control.updatedAt.toISOString(),
    };

    return { articles, article_translations };
  }
}
