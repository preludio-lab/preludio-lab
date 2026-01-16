import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/ArticleRepository';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { Article } from '@/domain/article/Article';
import { PagedResponse } from '@/domain/shared/Pagination';
import { ArticleMetadataDataSource, MetadataRow } from './turso-article-metadata.ds';
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

  /**
   * IDによる記事取得
   * メタデータとMDXコンテンツを取得し、ドメインモデルを構築して返します。
   *
   * @param id 記事ID
   * @param lang 言語コード
   * @returns Articleオブジェクト、見つからない場合はnull
   * @throws AppError データベース接続エラーやマッピングエラー時
   */
  async findById(id: string, lang: string): Promise<Article | null> {
    try {
      const row = await this.metadataDS.findById(id, lang);
      if (!row) {
        this.logger.warn(`Article not found by ID: ${id} (${lang})`, { id, lang });
        return null;
      }

      return await this._assembleArticle(row, id);
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`FindById failed: ${id}`, err as Error, { id, lang });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * スラグによる記事取得
   * メタデータとMDXコンテンツを取得し、ドメインモデルを構築して返します。
   * カテゴリも検索条件に含まれます。
   *
   * @param lang 言語コード
   * @param category 記事カテゴリ
   * @param slug URLスラグ
   * @returns Articleオブジェクト、見つからない場合はnull
   * @throws AppError データベース接続エラーやマッピングエラー時
   */
  async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
    try {
      const row = await this.metadataDS.findBySlug(slug, lang, category);
      if (!row) {
        this.logger.warn(`Article not found by slug: ${slug} (${lang})`, { category, slug, lang });
        return null;
      }

      return await this._assembleArticle(row, slug);
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`FindBySlug failed: ${slug}`, err as Error, { slug, lang, category });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 記事一覧取得
   * 検索条件に基づいて記事を検索します。
   * パフォーマンス最適化のため、メタデータのみを取得し、コンテンツ（MDX）は取得しません。
   * 返却されるArticleオブジェクトの `content.body` は `null` となります。
   *
   * @param criteria 検索条件 (言語、カテゴリ、ページネーション等)
   * @returns 記事一覧とページネーション情報
   */
  async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
    try {
      // 1. メタデータのみ取得 (R2へのアクセスはしない = 高速 & 低コスト)
      const { rows, totalCount } = await this.metadataDS.findMany({
        lang: criteria.lang,
        category: criteria.category,
        limit: criteria.limit,
        offset: criteria.offset,
      });

      // 2. マッピング (Contentはnullとして扱う)
      const items = rows
        .map((row) => {
          try {
            // 第3引数(content)を渡さない -> Mapper内で null として処理される
            return TursoArticleMapper.toDomain(row.articles, row.article_translations);
          } catch (e) {
            this.logger.error(`Mapping failed for article in list: ${row.articles.id}`, e as Error);
            return null;
          }
        })
        .filter((item): item is Article => item !== null);

      // 3. ページネーション情報の構築
      const currentEnd = (criteria.offset || 0) + items.length;
      const hasNextPage = totalCount > currentEnd;

      return {
        items,
        totalCount, // 現在は0が返る仮実装
        hasNextPage, // TODO: totalCount実装後に機能する
      };
    } catch (err) {
      this.logger.error('FindMany failed', err as Error);
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 記事保存 (未実装)
   * 現時点では読み取り専用のため、呼び出すとエラーになります。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async save(_: Article): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * 記事削除 (未実装)
   * 現時点では読み取り専用のため、呼び出すとエラーになります。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(_: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // --- Private Helpers ---

  /**
   * データベース行からArticleドメインオブジェクトを組み立てる内部メソッド
   * R2からコンテンツを取得し、Mapperを使用してドメインモデルに変換します。
   */
  private async _assembleArticle(row: MetadataRow, contextId: string): Promise<Article> {
    let content = '';

    // R2からのコンテンツ取得 (mdxPathがある場合のみ)
    if (row.article_translations.mdxPath) {
      try {
        content = await this.contentDS.getContent(row.article_translations.mdxPath);
      } catch (err) {
        // コンテンツ取得失敗は致命的エラーとして扱う
        this.logger.error(
          `Content fetch failed: ${row.article_translations.mdxPath}`,
          err as Error,
          { contextId },
        );
        throw new AppError('Content fetch failed', 'INFRASTRUCTURE_ERROR', 500, err);
      }
    }

    // ドメインマッピング
    try {
      return TursoArticleMapper.toDomain(row.articles, row.article_translations, content);
    } catch (err) {
      this.logger.error(`Mapping failed: ${contextId}`, err as Error, { contextId });
      throw new AppError('Data mapping error', 'INTERNAL_SERVER_ERROR', 500, err);
    }
  }
}
