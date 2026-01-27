import verovio from 'verovio';
import fs from 'fs/promises';

// Singleton promise for the toolkit
let toolkitPromise: Promise<verovio.toolkit> | null = null;

async function getVerovioToolkit(): Promise<verovio.toolkit> {
  // verovio npm package usually handles its own initialization or is synchronous in Node
  return new verovio.toolkit();
}

export async function renderToSVG(
  xmlContent: string,
  options: Record<string, unknown> = {},
): Promise<string> {
  const vrvToolkit = await getVerovioToolkit();

  const defaultOptions = {
    scale: 100,
    adjustPageHeight: true,
    pageMarginTop: 0,
    pageMarginBottom: 0,
    pageMarginLeft: 0,
    pageMarginRight: 0,
    pageWidth: 1200,        // Content-friendly width
    header: 'none',
    footer: 'none',
    mdivAll: true,
    justifyVertically: false,
    noJustification: true,
    ...options,
  };

  vrvToolkit.setOptions(defaultOptions);
  vrvToolkit.loadData(xmlContent);
  vrvToolkit.redoLayout();

  // Render the first page (common for snippets)
  const svg = vrvToolkit.renderToSVG(1);
  return svg;
}

export async function saveSVG(svg: string, outputPath: string): Promise<void> {
  await fs.writeFile(outputPath, svg);
  console.log(`SVG saved to: ${outputPath}`);
}
