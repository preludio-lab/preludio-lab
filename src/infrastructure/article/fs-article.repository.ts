import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/ArticleRepository';
import { Article, ContentStructure, ContentSection } from '@/domain/article/Article';
import { ArticleContent } from '@/domain/article/ArticleContent';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { PagedResponse } from '@/domain/shared/Pagination';
import { ArticleSortOption, SortDirection } from '@/domain/article/ArticleConstants';
import { INITIAL_ENGAGEMENT_METRICS } from '@/domain/article/ArticleEngagement';
import { FsArticleMetadataDataSource, FsArticleContext } from './fs-article-metadata.ds';
import { FsArticleContentDataSource } from './fs-article-content.ds';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/AppError';
import { AppLocale } from '@/domain/i18n/Locale';

export class FsArticleRepository implements ArticleRepository {
  constructor(
    private metadataDS: FsArticleMetadataDataSource,
    private contentDS: FsArticleContentDataSource,
    private logger: Logger,
  ) {}

  async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
    try {
      const context = await this.metadataDS.findBySlug(lang, category, slug);
      if (!context) {
        // ビジネスルール: 見つからない場合は null を返すか？
        // 計画に従い: AppError('NOT_FOUND') をスローする。
        // ここでスローすれば、下でキャッチして WARN ログに変換できる。
        // 標準的なプラクティスとして、一意のエラーをスローし、catch ブロックでログ出力/変換を行う。
        throw new AppError(`Article not found (slug: ${slug})`, 'NOT_FOUND', 404);
      }

      const contentBody = await this.contentDS.getContent(context.filePath);
      return this.mapToDomain(context, contentBody);
    } catch (err) {
      if (err instanceof AppError && err.code === 'NOT_FOUND') {
        this.logger.warn(`Article not found: ${slug}`, { lang, category, slug });
        throw err;
      }
      this.logger.error(`Failed to find article by slug: ${slug}`, err as Error, {
        slug,
        lang,
        category,
      });
      throw new AppError('Failed to find article', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async findById(id: string, lang: string): Promise<Article | null> {
    try {
      // FS実装は通常slugを想定しているが、全件スキャンで対応可能
      const all = await this.metadataDS.findAll();
      // FS context treats id as slug. Ensure we also match the lang.
      const match = all.find((c) => c.id === id && c.lang === lang);
      if (!match) {
        throw new AppError(`Article not found (id: ${id}, lang: ${lang})`, 'NOT_FOUND', 404);
      }

      const contentBody = await this.contentDS.getContent(match.filePath);
      return this.mapToDomain(match, contentBody);
    } catch (err) {
      if (err instanceof AppError && err.code === 'NOT_FOUND') {
        this.logger.warn(`Article not found by ID: ${id}`, { id, lang });
        throw err;
      }
      this.logger.error(`Failed to find article by id: ${id}`, err as Error, { id, lang });
      throw new AppError('Failed to find article by id', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
    try {
      const allContexts = await this.metadataDS.findAll();
      // インメモリフィルタリング（DS内で深く最適化可能だが、現在は構成されたリポジトリがここで行う）
      // パフォーマンスのために、まずはコンテキスト/メタデータでフィルタリングする。

      let candidates = allContexts;

      // 1. 言語
      if (criteria.lang) {
        candidates = candidates.filter((c) => c.lang === criteria.lang);
      }

      // 2. ステータス
      if (criteria.status && criteria.status.length > 0) {
        candidates = candidates.filter((c) => criteria.status!.includes(c.status));
      }

      // 3. カテゴリ
      if (criteria.category) {
        candidates = candidates.filter((c) => c.category === criteria.category);
      }

      // 4. タグ
      if (criteria.tags && criteria.tags.length > 0) {
        candidates = candidates.filter((c) =>
          criteria.tags!.every((tag) => c.metadata.tags.includes(tag)),
        );
      }

      // シリーズ、特集、メタデータフィルタ...
      if (criteria.isFeatured !== undefined) {
        candidates = candidates.filter((c) => c.metadata.isFeatured === criteria.isFeatured);
      }
      if (criteria.minReadingLevel) {
        candidates = candidates.filter(
          (c) => (c.metadata.readingLevel || 0) >= criteria.minReadingLevel!,
        );
      }
      if (criteria.maxReadingLevel) {
        candidates = candidates.filter(
          (c) => (c.metadata.readingLevel || 0) <= criteria.maxReadingLevel!,
        );
      }

      // ソート
      const sortOption = criteria.sortBy || ArticleSortOption.PUBLISHED_AT;
      const direction = criteria.sortDirection || SortDirection.DESC;
      const modifier = direction === SortDirection.ASC ? 1 : -1;

      candidates.sort((a, b) => {
        /* コンテキスト用の簡易ソートロジック */
        let valA = 0;
        let valB = 0;
        switch (sortOption) {
          case ArticleSortOption.PUBLISHED_AT:
            valA = a.metadata.publishedAt ? a.metadata.publishedAt.getTime() : 0;
            valB = b.metadata.publishedAt ? b.metadata.publishedAt.getTime() : 0;
            break;
          // ... implement other sorts if needed
          default:
            valA = a.createdAt.getTime();
            valB = b.createdAt.getTime();
        }
        if (valA < valB) return -1 * modifier;
        if (valA > valB) return 1 * modifier;
        return 0;
      });

      // ページネーション
      const totalCount = candidates.length;
      const offset = criteria.offset || 0;
      const limit = criteria.limit || 20;
      const pagedCandidates = candidates.slice(offset, offset + limit);

      // ドメインへのマッピング（重い処理：コンテンツの読み込み）
      // 注: findMany は通常、コンテンツ（本文）を含む Article を返します。
      // 実際のシステムの多くでは、リストビューは「軽量な Article」（本文なし）を返す場合があります。
      // ドメイン定義では 'content' が必要です。
      const items: Article[] = [];
      for (const c of pagedCandidates) {
        const body = await this.contentDS.getContent(c.filePath);
        items.push(this.mapToDomain(c, body));
      }

      return {
        items,
        totalCount,
        hasNextPage: offset + limit < totalCount,
      };
    } catch (err) {
      this.logger.error('Failed to find articles', err as Error, { criteria });
      throw new AppError('Failed to find articles', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async save(article: Article): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const a = article;
    throw new Error(
      'Save not implemented in Composed Repository (Use legacy or finish implementation)',
    );
  }

  async delete(id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const i = id;
    throw new Error('Delete not implemented');
  }

  // Mapper
  private mapToDomain(context: FsArticleContext, body: string): Article {
    const structure = this.extractToc(body);
    return new Article({
      control: {
        id: context.id,
        lang: context.lang as AppLocale,
        status: context.status,
        createdAt: context.createdAt,
        updatedAt: context.updatedAt,
      },
      metadata: context.metadata,
      content: new ArticleContent({
        body: body,
        structure: structure,
      }),
      engagement: { metrics: INITIAL_ENGAGEMENT_METRICS },
      context: {
        seriesAssignments: [],
        relatedArticles: [],
        sourceAttributions: [],
        monetizationElements: [],
      },
    });
  }

  private extractToc(content: string): ContentStructure {
    // 正規表現ロジックのコピー
    const lines = content.split('\n');
    const sections: ContentStructure = [];
    let currentH2: ContentSection | null = null;
    const h2Regex = /^##\s+(.+)$/;
    const h3Regex = /^###\s+(.+)$/;

    for (const line of lines) {
      const h2Match = line.match(h2Regex);
      if (h2Match) {
        currentH2 = { id: this.slugify(h2Match[1]), heading: h2Match[1], level: 2, children: [] };
        sections.push(currentH2);
        continue;
      }
      const h3Match = line.match(h3Regex);
      if (h3Match && currentH2) {
        currentH2.children = currentH2.children || [];
        currentH2.children.push({ id: this.slugify(h3Match[1]), heading: h3Match[1], level: 3 });
      }
    }
    return sections;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-]+/g, '');
  }
}
