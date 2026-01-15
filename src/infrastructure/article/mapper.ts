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
    // メモ: translationRow.metadata はスキーマ上で ArticleMetadata として型定義されていますが、ランタイムでは JSON の可能性があります。
    // 'mode: json' が設定されていれば、Drizzle が JSON のパースを処理します。
    // ここでは、正規化されていないスナップショットや固有のフィールドをドメインメタデータにマージします。

    // DBは 'slGenre' などを個別に保存します。ドメインメタデータはそれらを集約します。
    // 型が ArticleMetadata インターフェースと一致することを確認する必要があります。
    // 現時点では基本的な構造を想定しています。

    // メタデータまたはデフォルトからカテゴリを解決しますか？
    // 新しいスキーマの articles テーブルには 'category' が明示的に存在しないため（タグに含まれている可能性があります）、
    // 導出するか、メタデータ JSON に含まれている必要があります。
    // 'metadata.category' が存在するか、バリデーションルールが適用されると仮定します。
    // なければ、今のところ 'WORK' にフォールバックします（または厳密にチェックします）。

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

    // 5. Engagement (今のところプレースホルダー)
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
