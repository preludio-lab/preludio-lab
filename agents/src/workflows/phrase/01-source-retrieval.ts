/**
 * 01-source-retrieval.ts
 *
 * 役割: 外部リポジトリ（OpenScore, Mutopia, KernScores）からデータを取得し、
 * MusicXML形式に正規化して Cloudflare R2 に永続化（Original）する。
 *
 * 永続化パス: sources/{composer_id}/{work_id}/full.musicxml
 */

import { z } from 'zod';
import { consola } from 'consola';

const _SourceRetrievalSchema = z.object({
  composerId: z.string(),
  workId: z.string(),
  sourceUrl: z.string().url(),
  format: z.enum(['musicxml', 'humdrum', 'mei']),
});

export async function main() {
  consola.info('Starting Source Retrieval & Normalization...');
  // TODO:
  // 1. 指定されたURLからデータをダウンロード
  // 2. Humdrum (*.krn) の場合は MusicXML に変換
  // 3. Cloudflare R2 (sources/...) にアップロード
  // 4. ローカルキャッシュ (workspace/cache/...) に保存
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(consola.error);
}
