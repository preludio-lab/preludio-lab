import verovio, { type toolkit as _toolkit } from 'verovio';
import fs from 'fs/promises';
import { consola } from 'consola';

// Singleton promise for the toolkit
// const toolkitPromise: Promise<toolkit> | null = null;

export async function renderToSVG(xml: string): Promise<string> {
  const vrv = await verovio.module();
  const tk = new vrv.toolkit();

  tk.setOptions({
    // scale: 100,
    pageWidth: 2100,
    pageHeight: 2970,
    // border: 0,
  });

  tk.loadData(xml);
  const svg = tk.renderToSVG(1, {});
  return svg;
}

export async function saveSVG(svg: string, outputPath: string): Promise<void> {
  await fs.writeFile(outputPath, svg);
  consola.success(`SVG saved to: ${outputPath}`);
}
