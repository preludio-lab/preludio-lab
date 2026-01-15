import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/ArticleRepository';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { Article } from '@/domain/article/Article';
import { PagedResponse } from '@/domain/shared/Pagination';
import { ArticleMetadataDataSource } from './turso-metadata.ds';
import { ArticleContentDataSource } from './r2-content.ds';
import { TursoArticleMapper } from './turso-article.mapper';

export class TursoArticleRepository implements ArticleRepository {
  constructor(
    private metadataDS: ArticleMetadataDataSource,
    private contentDS: ArticleContentDataSource,
  ) { }

  async findById(_id: string): Promise<Article | null> {
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
    // 1. Fetch Metadata
    const row = await this.metadataDS.findBySlug(slug, lang);
    if (!row) return null;

    // 2. Fetch Content (MDX)
    let content = '';
    if (row.article_translations.mdxPath) {
      content = await this.contentDS.getContent(row.article_translations.mdxPath);
    }

    // 3. Map to Domain
    return TursoArticleMapper.toDomain(row.articles, row.article_translations, content);
  }

  async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
    // リストビューの実装
    return {
      items: [],
      totalCount: 0,
      hasNextPage: false,
    };
  }

  async save(_article: Article): Promise<void> {
    // 現時点では読み取り専用の実装
    throw new Error('Method not implemented.');
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
