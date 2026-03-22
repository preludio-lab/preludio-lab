/**
 * 04-svg-render.ts
 *
 * 役割: MusicXML スニペットを Verovio でレンダリングし、Staging 領域に出力する。
 *
 * プレビュー用パス: staging/phrases/{phrase_id}.svg
 */

import { consola } from 'consola';

export async function main() {
  consola.info('Rendering SVG for Preview (Staging)...');
  // TODO:
  // 1. Verovio でレンダリング
  // 2. モバイル最適化設定を適用 (pageWidth, adjustPageHeight, border: 0 等)
  // 3. Staging 領域 (R2 or Local) に出力
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(consola.error);
}
