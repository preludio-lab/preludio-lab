import { AppLocale } from '@/domain/i18n/locale';
import { Article, ArticleSummary } from '@/domain/article/article';
import {
  ArticleStatus,
  ArticleControl,
  ArticleId,
  ArticleMasterId,
} from '@/domain/article/article.control';
import {
  ArticleCategory,
  ArticleMetadata,
  ArticleMetadataSchema,
} from '@/domain/article/article.metadata';
import { AppError } from '@/domain/shared/app-error';
import { ArticleMetadataRow, ArticleMasterRow, ArticleRow } from './article.metadata.ds.interface';

/**
 * メタデータJSONのバリデーション用スキーマ。
 * データベースのJSONカラムに保存されている、個別のカラムを持たない追加属性を検証します。
 */
const MetadataSchema = ArticleMetadataSchema.partial().passthrough();

/**
 * Turso (SQLite/D1) のデータ構造とドメインエンティティの相互変換を行うマッパークラス。
 * 記事のメタデータ（Summary）の永続化と復元を主な責務とします。
 */
export class TursoArticleMapper {
  /**
   * DBの行データ（記事基本情報と翻訳データ）からサマリーエンティティに変換します。
   *
   * @param masterRow - 記事の基本属性を含む行データ (ArticleMasterRow)
   * @param articleRow - 言語固有の翻訳データを含む行データ (ArticleRow)
   * @returns 再構築された ArticleSummary ドメインエンティティ
   * @throws {AppError} バリデーションエラーや不正なステータス・カテゴリが検出された場合
   */
  static toSummary(masterRow: ArticleMasterRow, articleRow: ArticleRow): ArticleSummary {
    const lang = articleRow.lang as AppLocale;

    // 1. メタデータJSONの解析とバリデーション
    const rawMetadata = articleRow.metadata || {};
    const parsedMetadataResult = MetadataSchema.safeParse(rawMetadata);

    if (!parsedMetadataResult.success) {
      throw new AppError(
        `Invalid metadata structure for article: ${masterRow.id}`,
        'INTERNAL_SERVER_ERROR',
        500,
        parsedMetadataResult.error,
      );
    }
    const safeBaseMetadata = parsedMetadataResult.data;

    // 2. 記事ステータスの検証
    const rawStatus = articleRow.status;
    const status = rawStatus as ArticleStatus;
    if (!Object.values(ArticleStatus).includes(status)) {
      throw new AppError(`Invalid status detected: ${rawStatus}`, 'INTERNAL_SERVER_ERROR', 500);
    }

    // 3. 制御情報 (ArticleControl) の構築
    const control: ArticleControl = {
      // 言語版ごとに固有のID (Translation UUID) をエンティティの主識別子とする
      id: articleRow.id as ArticleId,
      // 共通のマスターID (Article UUID) を保持
      masterId: masterRow.id as ArticleMasterId,
      lang: lang,
      status: status,
      createdAt: new Date(masterRow.createdAt),
      updatedAt: new Date(articleRow.updatedAt),
    };

    // 4. カテゴリとスラッグの解決 (翻訳層でのオーバーライドを優先)
    const categoryName = articleRow.slCategory || masterRow.category;
    const category = categoryName as ArticleCategory;
    if (!Object.values(ArticleCategory).includes(category)) {
      throw new AppError(
        `Invalid category detected: ${categoryName}`,
        'INTERNAL_SERVER_ERROR',
        600,
      );
    }

    const slug = articleRow.slSlug || masterRow.slug;

    // 5. メタデータ (ArticleMetadata) の構築
    const metadata: ArticleMetadata = {
      ...safeBaseMetadata,
      slug: slug,
      category: category,
      title: articleRow.title,
      publishedAt: articleRow.publishedAt ? new Date(articleRow.publishedAt) : null,
      isFeatured: masterRow.isFeatured || articleRow.isFeatured || false,
      displayTitle: articleRow.displayTitle,
      readingTimeSeconds: masterRow.readingTimeSeconds,
      composerName: articleRow.slComposerName || safeBaseMetadata.composerName || '',
      thumbnail: masterRow.thumbnailPath || safeBaseMetadata.thumbnail || undefined,
      tags: safeBaseMetadata.tags || [],
    };

    // 6. コンテキスト情報 (Context) の構築
    const context = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      seriesAssignments: (articleRow.slSeriesAssignments as any) || [],
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
   * ドメインエンティティを永続化用のDB行データに変換します。
   * 1つのエンティティは、基本情報 (articles) と翻訳データ (article_translations) の2つのテーブルに分解されます。
   *
   * @param article - 変換対象の記事（Summary または フルAggregate）
   * @returns 永続化用のデータ行セット
   */
  static toPersistence(article: Article | ArticleSummary): ArticleMetadataRow {
    // 記事基本情報テーブル用のデータ (Master)
    const articles: ArticleMasterRow = {
      id: article.masterId,
      workId: null, // 必要に応じて拡張（特定の楽曲解説記事など）
      slug: article.slug,
      category: article.category,
      isFeatured: article.isFeatured,
      readingTimeSeconds: article.metadata.readingTimeSeconds || 0,
      thumbnailPath: article.metadata.thumbnail || null,
      createdAt: article.control.createdAt.toISOString(),
      updatedAt: article.control.updatedAt.toISOString(),
    };

    // 翻訳データテーブル用のデータ (Translation)
    const article_translations: ArticleRow = {
      id: article.id,
      articleId: article.masterId,
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
      // 目次構造は常にMDXから動的に生成するため、DBには最小限のプレースホルダのみ保持する。
      // これにより、MDXの修正とDBの目次データの乖離を防ぎます。
      contentStructure: [],
      createdAt: article.control.createdAt.toISOString(),
      updatedAt: article.control.updatedAt.toISOString(),
    };

    return { articles, article_translations };
  }
}
