import verovio from 'verovio';
import fs from 'fs/promises';

export async function renderToSVG(
  xmlContent: string,
  options: Record<string, unknown> = {},
): Promise<string> {
  const vrvToolkit = new verovio.toolkit();

  // Basic options for web display
  const defaultOptions = {
    scale: 100,
    pageWidth: 2100,
    pageHeight: 2970,
    header: 'none',
    footer: 'none',
    mdivAll: true,
    ...options,
  };

  vrvToolkit.setOptions(defaultOptions);
  vrvToolkit.loadData(xmlContent);

  // Render the first page (common for snippets)
  const svg = vrvToolkit.renderToSVG(1);
  return svg;
}

export async function saveSVG(svg: string, outputPath: string): Promise<void> {
  await fs.writeFile(outputPath, svg);
  console.log(`SVG saved to: ${outputPath}`);
}
