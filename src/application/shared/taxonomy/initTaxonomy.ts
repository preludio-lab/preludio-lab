import { TaxonomyFileRepository } from '@/infrastructure/shared/taxonomy/TaxonomyFileRepository';
import { taxonomy } from '@/domain/shared/taxonomy/TaxonomyRegistry';

/**
 * タクソノミーの初期化を行うアプリケーションサービス。
 * サーバーサイドでのみ呼び出されることを想定しています。
 */
export async function initTaxonomy() {
  const repo = TaxonomyFileRepository.getInstance();
  const data = await repo.getAllTaxonomy();
  taxonomy.initialize(data);
}
