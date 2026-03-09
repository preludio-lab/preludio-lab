import { Command } from 'commander';
import { downloadMusicXML } from './services/source-fetcher.js';
import { sliceMusicXML } from './core/musicxml-slicer.js';
import { renderToSVG, saveSVG } from './services/svg-renderer.js';
import { MusicXMLOptimizer } from './core/musicxml-optimizer.js';
import fs from 'fs/promises';
import path from 'path';
import { consola } from 'consola';

const program = new Command();

program
  .name('phrase-generator')
  .description('Source fetching, slicing, and rendering workflow for PreludioLab')
  .version('1.0.0')
  .option('-f, --file <path>', 'Path to local MusicXML file')
  .option('-u, --url <url>', 'URL to remote MusicXML file')
  .option('-o, --output <path>', 'Output SVG path')
  .option('-s, --start <measure>', 'Start measure number')
  .option('-e, --end <measure>', 'End measure number')
  .option('-p, --part <id>', 'Part ID to extract')
  .option('--staff <number>', 'Staff number to extract')
  .action(async (options) => {
    let xmlContent = '';

    try {
      // Input Validation
      if (!options.file && !options.url) {
        consola.error('Error: Either --file or --url must be provided.');
        process.exit(1);
      }
      if (!options.output) {
        consola.error('Error: --output <path> is required.');
        process.exit(1);
      }

      // 1. Acquisition
      if (options.file) {
        consola.info(`Loading local file: ${options.file}`);
        const xmlBuffer = await fs.readFile(options.file);
        xmlContent = xmlBuffer.toString();
      } else {
        consola.info(`Downloading from URL: ${options.url}`);
        // For URL, we might need a temp file or just keep in memory if downloadMusicXML supports returning string.
        // Current downloadMusicXML writes to file. Let's use a temp path.
        const tempPath = path.join(process.cwd(), 'temp_source', 'downloaded.musicxml');
        await downloadMusicXML(options.url, tempPath);
        const xmlBuffer = await fs.readFile(tempPath);
        xmlContent = xmlBuffer.toString();
      }

      // 2. Slicing (Optional)
      if (options.start || options.end || options.part || options.staff) {
        consola.info(
          `Slicing config: Measures ${options.start}-${options.end}, Part: ${options.part}, Staff: ${options.staff}`,
        );
        xmlContent = sliceMusicXML(xmlContent, {
          startMeasure: options.start ? parseInt(options.start) : undefined,
          endMeasure: options.end ? parseInt(options.end) : undefined,
          partId: options.part,
          staffNumber: options.staff ? parseInt(options.staff) : undefined,
        });
      }

      // 3. Optimization
      consola.info('Optimizing MusicXML...');
      const optimizer = new MusicXMLOptimizer();

      // フィルタリング（単一スコア化）が行われている場合、視覚的最適化を有効にする
      const isFiltered = !!(options.part || options.staff);
      const optimizedXml = optimizer.optimize(xmlContent, {
        removePartGroups: true,
        resetPositioning: true,
        alignDynamics: isFiltered,
      });

      // Validating/Debugging: Save optimized XML
      const debugXmlPath = options.output.replace('.svg', '.debug.xml');
      consola.info(`Saving optimized XML to: ${debugXmlPath}`);
      await fs.writeFile(debugXmlPath, optimizedXml);

      // 4. Rendering
      consola.info('Rendering to SVG...');
      const svg = await renderToSVG(optimizedXml);

      const outputPath = options.output;
      await saveSVG(svg, outputPath);

      consola.success(`Success! SVG saved to: ${outputPath}`);
      process.exit(0);
    } catch (error) {
      consola.error('Workflow failed:', error);
      process.exit(1);
    }
  });

program.parse();
