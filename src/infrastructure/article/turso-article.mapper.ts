import { AppLocale } from '@/domain/i18n/Locale';
import { Article } from '@/domain/article/Article';
import { ArticleStatus } from '@/domain/article/ArticleControl';
import {
  ArticleCategory,
  ArticleMetadata,
  ArticleMetadataSchema,
} from '@/domain/article/ArticleMetadata';
import { articles, articleTranslations } from '../database/schema';
import { InferSelectModel } from 'drizzle-orm';

import { AppError } from '@/domain/shared/AppError';

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

    // 3. Control
    const control = {
      id: articleRow.id,
      lang: lang,
      status: translationRow.status as ArticleStatus, // statusもZodで検証可能だが今回は省略
      createdAt: new Date(articleRow.createdAt),
      updatedAt: new Date(translationRow.updatedAt),
      version: 1,
    };

    // 4. Resolve Category & Slug
    // Snapshot (sl_) -> Master Fallback
    const categoryName = translationRow.slCategory || articleRow.category;
    // Category文字列をEnumにキャスト（検証推奨）
    // ここでは安全のため、もし不正な文字列なら 'WORK' 等にするかエラーにする
    // 今回はキャストとして扱うが、実運用では isValidCategory チェックを入れるべき
    const category = categoryName as ArticleCategory;

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
    // mdxContentが明示的に渡されない場合は null (未取得) とする
    const content = {
      body: mdxContent ?? null,
      structure: translationRow.contentStructure || [],
    };

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
