/**
 * 02-phrase-extraction.ts
 *
 * 役割: MusicXML から指定された小節を抽出し、レンダリングに必要な属性を注入する。
 *
 * 重要: 抽出範囲の直前にある最新の Clef, Key, Time を特定し、
 * 抽出したスニペットの先頭に注入するロジックを実装してください。
 */

import { z } from 'zod';
import { consola } from 'consola';

const _ExtractionSchema = z.object({
  sourceXmlPath: z.string(),
  startMeasure: z.number(),
  endMeasure: z.number(),
  partId: z.string().optional(), // 特定のパート（例: Piano, Violin）のみ抽出する場合
});

export async function main() {
  consola.info('Starting Phrase Extraction with Attribute Injection...');
  // TODO:
  // 1. MusicXML をパース
  // 2. 指定範囲の <measure> を抽出
  // 3. 抽出範囲より前の最新の <attributes> (clef, key, time) を検索
  // 4. 先頭小節に検索した属性を注入
  // 5. 整合性のある MusicXML スニペットとして保存
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(consola.error);
}
