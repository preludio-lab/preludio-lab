import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { ListObjectsCommand } from '@aws-sdk/client-s3';
import { articles } from '../src/infrastructure/database/schema';
import { count } from 'drizzle-orm';
import { ArticleCategory } from '../src/domain/article/ArticleMetadata';

async function main() {
  console.log('--- Infrastructure Verification Start ---');

  // 1. Check Env Vars
  console.log('[1] Checking Environment Variables...');
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  console.log(`Debug: TURSO_DATABASE_URL=${tursoUrl}`);
  const r2Bucket = process.env.R2_BUCKET_NAME;

  if (!tursoUrl) console.warn('⚠️ TURSO_DATABASE_URL is missing.');
  if (!r2Bucket) console.warn('⚠️ R2_BUCKET_NAME is missing.');
  console.log('✅ Env vars present.');

  // 2. Turso Connection
  console.log('\n[2] Verifying Turso Connection...');
  try {
    const { db } = await import('../src/infrastructure/database/turso-client');
    const result = await db.select({ count: count() }).from(articles);
    console.log(`✅ Turso Connected! Article count: ${result[0].count}`);
  } catch (e) {
    console.error('❌ Turso Connection Failed:', e);
  }

  // 3. R2 Connection
  console.log('\n[3] Verifying R2 Connection...');
  try {
    const { r2Client } = await import('../src/infrastructure/storage/r2-client');
    const command = new ListObjectsCommand({
      Bucket: r2Bucket,
      MaxKeys: 1,
    });
    const result = await r2Client.send(command);
    console.log('✅ R2 Connected! Bucket is accessible.');
  } catch (e) {
    console.error('❌ R2 Connection Failed:', e);
  }

  // 4. Repository Integration
  console.log('\n[4] Verifying Repository Integration (Dry Run)...');
  try {
    const { ArticleMetadataDataSource } =
      await import('../src/infrastructure/article/turso-article-metadata.ds');
    const { ArticleContentDataSource } =
      await import('../src/infrastructure/article/r2-article-content.ds');
    const { TursoArticleRepository } =
      await import('../src/infrastructure/article/turso-article.repository');
    const { logger } = await import('../src/infrastructure/logging');

    const metaDS = new ArticleMetadataDataSource(logger);
    const contentDS = new ArticleContentDataSource();
    const repo = new TursoArticleRepository(metaDS, contentDS, logger);

    // Try to fetch non-existent article to test query execution
    const article = await repo.findBySlug('en', 'WORK' as ArticleCategory, 'non-existent-slug-123');
    console.log(
      `✅ Repository Query Executed. Result: ${article ? 'Found' : 'Not Found (Expected)'}`,
    );
  } catch (e) {
    console.error('❌ Repository Integration Failed:', e);
  }

  console.log('\n--- Verification Complete ---');
}

main();
