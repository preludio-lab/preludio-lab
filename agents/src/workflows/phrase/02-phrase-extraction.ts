/**
 * 02-phrase-extraction.ts
 *
 * 巨大な MusicXML スコアから、特定の小節（フレーズ）を抽出して
 * 小規模な MusicXML スニペットを生成する役割を担当します。
 */

import { z } from 'zod';
import { consola } from 'consola';

const _ExtractionSchema = z.object({
  sourcePath: z.string(),
  startMeasure: z.number(),
  endMeasure: z.number(),
});

export async function main() {
  consola.info('Starting Phrase Extraction...');
  // TODO: Implement MusicXML measure extraction logic
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(consola.error);
}
