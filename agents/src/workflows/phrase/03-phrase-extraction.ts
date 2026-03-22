/**
 * 03-phrase-extraction.ts
 *
 * 役割: Step 2 で特定した PartID と指定小節範囲を元に、フレーズを抽出する。
 *
 * ロジック: 決定論的な抽出コード + 属性 (Clef/Key/Time) の動的注入。
 */

import { z } from 'zod';
import { consola } from 'consola';

const _ExtractionSchema = z.object({
  sourceXmlPath: z.string(),
  partId: z.string(), // Step 2 で取得した ID (e.g. P1)
  startMeasure: z.number(),
  endMeasure: z.number(),
  startBeat: z.number().optional(),
  endBeat: z.number().optional(),
  phraseId: z.string(),
});

export async function main() {
  consola.info('Executing Phrase Extraction with PartID and Attributes...');
  // TODO:
  // 1. 指定パート・小節・拍を抽出
  // 2. 直前の最新属性を注入 (syncAttributes)
  // 3. スニペット XML を暫定保存
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(consola.error);
}
