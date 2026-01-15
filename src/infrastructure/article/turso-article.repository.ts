import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/ArticleRepository';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { Article } from '@/domain/article/Article';
import { PagedResponse } from '@/domain/shared/Pagination';
import { ArticleMetadataDataSource } from './turso-article-metadata.ds';
import { ArticleContentDataSource } from './r2-article-content.ds';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/AppError';
import { TursoArticleMapper } from './turso-article.mapper';

export class TursoArticleRepository implements ArticleRepository {
  constructor(
    private metadataDS: ArticleMetadataDataSource,
    private contentDS: ArticleContentDataSource,
    private logger: Logger,
  ) { }

  async findById(_id: string): Promise<Article | null> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const unusedId = _id;
    // IDでの検索には言語コンテキストが必要かもしれません。
    // ArticleRepositoryインターフェースのfindByIdは、通常、特定のコンテキストでの取得、またはデフォルト言語を返すことを意味しますか？
    // このシステムでは、Article Entityはローカライズされています。したがって、おそらくLangが必要です。
    // しかし、インターフェース定義 `findById(id: string)` は言語を受け取りません。
    // これは、IDが翻訳ごとに一意であるか（article_translationsにある）、
    // またはインターフェースを変更/明確化する必要があることを意味します。
    //
    // スキーマを見ると: `article_translations.id` がPKです。
    // ドメイン `Article.id` が `articles.id` (Universal ID) に対応する場合、言語なしではfindByIdは曖昧です。
    // ドメイン `Article.id` が `article_translations.id` に対応する場合、一意です。

    // 仮定: 通常は Slug + Lang でアクセスします。
    // findByIdについては、有効なIDがUniversal IDを参照していると仮定し、デフォルトで 'en' とするべきか、すべて取得するべきか？
    // 実際、クリーンアーキテクチャ的には、リポジトリがこれを処理するべきです。
    // findByIdの実装詳細は保留するか、まだサポートされていない場合は汎用エラーをスローさせますが、
    // `metadata.ds.ts` を見ると `findById(id, lang)` を実装しました。

    // 今のところ、指定されていない場合はデフォルトの 'en' を取得するか、失敗させるか？
    // あるいは、ここで渡されるIDは翻訳IDなのかもしれません。
    // 確信が持てない場合は、Universal IDと仮定し、ローカル開発コンテキスト用にデフォルト言語 'ja' としますが、
    // メインのユースケースとしては findBySlug に固執するのが良さそうです。

    return null; // 言語コンテキストが必要なため、厳密には未実装です。
  }

  async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
    try {
      // 1. Fetch Metadata
      const row = await this.metadataDS.findBySlug(slug, lang);
      if (!row) {
        this.logger.warn(`Article not found (slug: ${slug}, lang: ${lang})`, {
          category,
          slug,
          lang,
        });
        // ビジネスルール: 見つからない場合は null を返す（リポジトリパターンでは通常 null を返すか EntityNotFound をスローする）
        // 実装計画では "AppError(..., 'NOT_FOUND') をスローする" と定義
        // ArticleRepository インターフェースのシグネチャは `Promise<Article | null>` だが、
        // フィードバック「404 (NOT_FOUND) の扱い...」に従い、AppError をスローする方針とする。
        // インフラ層での try/catch と再スローにより一貫性を保つ。
        throw new AppError(`Article not found: ${slug}`, 'NOT_FOUND', 404);
      }

      // 2. Fetch Content (MDX)
      let content = '';
      if (row.article_translations.mdxPath) {
        try {
          content = await this.contentDS.getContent(row.article_translations.mdxPath);
        } catch (e) {
          // コンテンツの欠落は部分的失敗か？致命的か？
          // 翻訳は存在するがコンテンツがない場合 -> エラーか警告か？
          // インフラストラクチャエラーとして扱うが、回復可能かもしれない？
          // 現時点では、一貫性を保つためにハードフェイル（例外スロー）とする。
          throw e; // Caught below
        }
      }

      // 3. Map to Domain
      return TursoArticleMapper.toDomain(row.articles, row.article_translations, content);
    } catch (err) {
      if (err instanceof AppError) {
        // 既に処理済み（例: NOT_FOUND）
        if (err.code === 'NOT_FOUND') {
          // NOT_FOUND をスローすることにした場合、警告ログを出力して再スローすべき
          this.logger.warn(err.message, { code: err.code, slug, lang });
          throw err;
        }
      }

      this.logger.error(`Failed to find article by slug: ${slug}`, err as Error, {
        slug,
        lang,
        category,
      });
      throw new AppError('Failed to find article', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const c = criteria;
    // リストビューの実装
    return {
      items: [],
      totalCount: 0,
      hasNextPage: false,
    };
  }

  async save(_article: Article): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const a = _article;
    // 現時点では読み取り専用の実装
    throw new Error('Method not implemented.');
  }

  async delete(_id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const i = _id;
    throw new Error('Method not implemented.');
  }
}
