import dotenv from 'dotenv';
import { consola } from 'consola';

dotenv.config({ path: '.env.local' });

async function syncArticles() {
  // 動的インポートを使用して、環境変数が読み込まれた後に他モジュールをロードする
  const { FsArticleMetadataDataSource } =
    await import('@/infrastructure/article/metadata/fs.article.metadata.ds');
  const { db } = await import('@/infrastructure/database/turso.client');
  const { articles, articleTranslations } = await import('@/infrastructure/database/schema');
  const { eq, and } = await import('drizzle-orm');
  const { ArticleSortOption, SortDirection } = await import('@/domain/article/article.constants');

  consola.info('Starting article sync...');

  // Use new instance
  const fsSource = new FsArticleMetadataDataSource();

  // Load all articles from file system
  const searchCriteria = {
    sort: {
      field: ArticleSortOption.PUBLISHED_AT,
      direction: SortDirection.DESC,
    },
    pagination: {
      limit: 1000,
      offset: 0,
    },
    filter: {
      lang: 'ja', // Default to ja for sync
    },
  };

  const result = await fsSource.search(searchCriteria);

  consola.info(`Found ${result.totalCount} articles in file system.`);

  for (const row of result.rows) {
    try {
      const { articles: master, article_translations: translation } = row;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { mdxPath, ...translationData } = translation;

      consola.info(`Syncing article: ${master.slug} (${translation.lang})`);

      // Check existing article
      const existingArticle = await db.query.articles.findFirst({
        where: eq(articles.slug, master.slug),
      });

      if (!existingArticle) {
        await db.insert(articles).values(master);
        consola.success(`Inserted article: ${master.slug}`);
      } else {
        consola.debug(`Article exists: ${master.slug}`);
      }

      // Check existing translation
      const existingTrans = await db.query.articleTranslations.findFirst({
        where: and(
          eq(articleTranslations.articleId, translation.articleId),
          eq(articleTranslations.lang, translation.lang),
        ),
      });

      if (!existingTrans) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await db.insert(articleTranslations).values(translationData as any);
        consola.success(`Inserted translation: ${translation.lang}`);
      } else {
        // Update
        await db
          .update(articleTranslations)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .set(translationData as any)
          .where(
            and(
              eq(articleTranslations.articleId, translation.articleId),
              eq(articleTranslations.lang, translation.lang),
            ),
          );
        consola.info(`Updated translation: ${translation.lang}`);
      }
    } catch (e) {
      consola.error(`Failed to sync article`, e as Error);
    }
  }

  consola.success('Sync complete.');
}

syncArticles().catch((e) => {
  consola.error(e as Error);
  process.exit(1);
});
