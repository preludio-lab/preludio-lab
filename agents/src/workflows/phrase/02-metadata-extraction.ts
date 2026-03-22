/**
 * 02-metadata-extraction.ts
 *
 * 役割: MusicXML から <part-list> を抽出し、楽器名と PartID の対応表を作成する。
 *
 * 出力例: [ { partId: "P1", instrumentName: "Violin I" }, ... ]
 * 理由: LLM が「第1バイオリンを抽出せよ」といった指示を P1 等の ID に紐付けるために必要。
 */

import { z } from 'zod';
import { consola } from 'consola';

const _MetadataExtractionSchema = z.object({
  sourceXmlPath: z.string(),
});

export async function main() {
  consola.info('Extracting PartID Mapping Metadata...');
  // TODO:
  // 1. MusicXML の <part-list> をパース
  // 2. PartID と <part-name> のマッピングを生成
  // 3. 次のステップ（エージェント）に渡すための JSON を出力
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(consola.error);
}
