/**
 * 01-source-retrieval.ts
 *
 * 役割: 外部リポジトリからデータを取得し、MusicXML 形式に正規化して R2 に保存する。
 *
 * 永続化パス (Original): sources/{composer_id}/{work_id}/full.musicxml
 */

import { z } from 'zod';
import { consola } from 'consola';

const _SourceRetrievalSchema = z.object({
  composerSlug: z.string(),
  workSlug: z.string(),
  workPartSlug: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});

export async function main() {
  consola.info('Starting Source Retrieval & Normalization (to MusicXML)...');
  // TODO:
  // 1. ソースをダウンロード (OpenScore, KernScores, Mutopia)
  // 2. KernScores (Humdrum) の場合は hum2xml で MusicXML に正規化
  // 3. R2 (sources/...) にアップロード
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(consola.error);
}
