import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function syncArticles() {
  // 動的インポートを使用して、dotenv.config() の後に読み込まれるようにする
  const { FsArticleMetadataDataSource } =
    await import('@/infrastructure/article/metadata/fs.article.metadata.ds');
  const { db } = await import('@/infrastructure/database/turso.client');
  const { articles, articleTranslations } = await import('@/infrastructure/database/schema');
  const { eq, and } = await import('drizzle-orm');
  const { logger } = await import('@/infrastructure/logging');
  const { ArticleSortOption, SortDirection } = await import('@/domain/article/article.constants');
  // 型定義のみインポート (動的インポートできないためトップレベルでインポートするか、型アサーションで対応)
  // ここではスクリプトなので簡便のため型アサーション用の型を定義、またはモジュールから型を取得
  type ArticleSearchCriteria = import('@/domain/article/article.repository').ArticleSearchCriteria;

  logger.info('Starting article sync...');

  // Use new instance
  const fsSource = new FsArticleMetadataDataSource();

  // Get all articles (setting high limit)
  // Casting to bypass "lang required" check in repo interface,
  // as FsArticleMetadataDataSource implementation allows empty lang to return all.
  // Casting to bypass "lang required" check in repo interface for FsSource
  const searchCriteria: ArticleSearchCriteria = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: {} as any, // FsMetadataDataSource allows empty filter to list all
    pagination: { limit: 1000, offset: 0 },
    sort: { field: ArticleSortOption.PUBLISHED_AT, direction: SortDirection.DESC },
  };

  const result = await fsSource.search(searchCriteria);

  logger.info(`Found ${result.totalCount} articles in file system.`);

  for (const row of result.rows) {
    try {
      const article = row.articles;
      const translation = row.article_translations;

      // Remove generated columns from payload
      // mdxPath is generatedAlwaysAs, so it must not be included in the insert/update payload.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { mdxPath, ...translationData } = translation;

      logger.info(`Syncing article: ${article.slug} (${translation.lang})`);

      // Check existing article
      const existingArticle = await db.query.articles.findFirst({
        where: eq(articles.id, article.id),
      });

      if (!existingArticle) {
        await db.insert(articles).values(article);
        logger.info(`Inserted article: ${article.slug}`);
      } else {
        logger.info(`Article exists: ${article.slug}`);
      }

      // Check existing translation
      const existingTrans = await db.query.articleTranslations.findFirst({
        where: and(
          eq(articleTranslations.articleId, article.id),
          eq(articleTranslations.lang, translation.lang),
        ),
      });

      if (!existingTrans) {
        // IDは FsArticleMetadataDS が生成したものを使用
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.insert(articleTranslations).values(translationData as any);
        logger.info(`Inserted translation: ${translation.lang}`);
      } else {
        // Update
        await db
          .update(articleTranslations)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .set(translationData as any)
          .where(
            and(
              eq(articleTranslations.articleId, article.id),
              eq(articleTranslations.lang, translation.lang),
            ),
          );
        logger.info(`Updated translation: ${translation.lang}`);
      }
    } catch (e) {
      logger.error(`Failed to sync article ${row.articles.slug}`, e as Error);
    }
  }

  logger.info('Sync complete.');
}

syncArticles()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
