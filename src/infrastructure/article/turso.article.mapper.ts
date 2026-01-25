import { AppLocale } from '@/domain/i18n/locale';
import { Article, ArticleId } from '@/domain/article/article';
import { ArticleStatus, ArticleControl } from '@/domain/article/article.control';
import {
  ArticleCategory,
  ArticleMetadata,
  ArticleMetadataSchema,
} from '@/domain/article/article.metadata';
import { ArticleContent } from '@/domain/article/article.content';
import { articles, articleTranslations } from '../database/schema';
import { InferSelectModel } from 'drizzle-orm';

import { AppError } from '@/domain/shared/app-error';

// Drizzle Result Type
type ArticleRow = InferSelectModel<typeof articles>;
type TranslationRow = InferSelectModel<typeof articleTranslations>;

// Zod Schema for Metadata JSON Validation
// JSONカラムの中身を検証するためのスキーマ (防腐層)
// ドメイン層のスキーマを流用し、JSONには全フィールドが含まれない可能性があるため partial() を適用
const MetadataSchema = ArticleMetadataSchema.partial().passthrough();

export class TursoArticleMapper {
  static toDomain(
    articleRow: ArticleRow,
    translationRow: TranslationRow,
    mdxContent?: string | null, // Optional for list views
  ): Article {
    // 1. Language Validation
    // 簡易的なチェック。厳密には AppLocales 定数などと比較すべき
    const lang = translationRow.lang as AppLocale;
    // 必要であればここで isValidLocale(lang) のようなチェックを行う

    // 2. Metadata Parsing & Validation
    const rawMetadata = translationRow.metadata || {};
    const parsedMetadataResult = MetadataSchema.safeParse(rawMetadata);

    if (!parsedMetadataResult.success) {
      // エンタープライズ品質: データの不整合を許容せずエラーにする
      throw new AppError(
        `Invalid metadata structure for article: ${articleRow.id}`,
        'INTERNAL_SERVER_ERROR',
        500,
        parsedMetadataResult.error,
      );
    }
    const safeBaseMetadata = parsedMetadataResult.data;

    // 3. Control & Status Safety
    // DBの値がDomainのEnumに存在するかチェック
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

    // 4. Resolve Category & Slug
    // Snapshot (sl_) -> Master Fallback
    const categoryName = translationRow.slCategory || articleRow.category;

    // Category Safety Check
    // カテゴリが不正な場合、エラーにするかデフォルト('WORK'等)にするか。
    // ここではデータ不整合として検知するためにエラーログに近い挙動を想定しつつ、安全に倒す
    const category = categoryName as ArticleCategory;
    if (!Object.values(ArticleCategory).includes(category)) {
      throw new AppError(
        `Invalid category detected: ${categoryName}`,
        'INTERNAL_SERVER_ERROR',
        500,
      );
    }

    const slug = translationRow.slSlug || articleRow.slug;

    // 5. Metadata Assembly
    const metadata: ArticleMetadata = {
      // JSON由来のデータ
      ...safeBaseMetadata,

      // DBカラム由来のデータ (優先/上書き)
      slug: slug,
      category: category,
      title: translationRow.title,
      publishedAt: translationRow.publishedAt ? new Date(translationRow.publishedAt) : null,
      isFeatured: articleRow.isFeatured || translationRow.isFeatured || false,
      displayTitle: translationRow.displayTitle,
      readingTimeSeconds: articleRow.readingTimeSeconds,

      // Snapshot / JSON values (with fallbacks for required fields)
      composerName: translationRow.slComposerName || safeBaseMetadata.composerName || '',
      thumbnail: articleRow.thumbnailPath || safeBaseMetadata.thumbnail || undefined,
      // tags are already mapped above, but need default
      tags: safeBaseMetadata.tags || [],
    };

    // 6. Content
    // contentStructureの型安全性を少し向上
    const rawStructure = translationRow.contentStructure;
    const structure = Array.isArray(rawStructure) ? rawStructure : [];

    // 重要: ArticleContentドメインモデルが body: string | null を許容している前提
    // クラスインスタンスを生成
    const content = new ArticleContent({
      body: mdxContent ?? null,
      structure: structure,
    });

    // 7. Context
    const context = {
      seriesAssignments: translationRow.slSeriesAssignments || [],
      relatedArticles: [],
      sourceAttributions: [],
      monetizationElements: [],
    };

    // 8. Engagement
    const engagement = undefined;

    return new Article({
      control,
      metadata,
      content,
      context,
      engagement,
    });
  }
}
