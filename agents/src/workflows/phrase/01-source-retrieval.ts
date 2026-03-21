/**
 * 01-source-retrieval.ts
 *
 * OpenScore GitHub や KernScores 等の外部リポジトリから MusicXML データを取得し、
 * ローカルのキャッシュディレクトリに保存する役割を担当します。
 */

import { z } from 'zod';
import { consola } from 'consola';

const _SourceRetrievalSchema = z.object({
  composer: z.string(),
  work: z.string(),
  opus: z.string().optional(),
});

export async function main() {
  consola.info('Starting Source Retrieval...');
  // TODO: Implement MusicXML fetching logic using GitHubTool or ResilientFetcher
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(consola.error);
}
