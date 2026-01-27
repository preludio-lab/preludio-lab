import { Command } from 'commander';
import { downloadMusicXML } from './services/source-fetcher.js';
import { sliceMusicXML } from './services/score-slicer.js';
import { renderToSVG, saveSVG } from './services/svg-renderer.js';
import { MusicXMLOptimizer } from './core/musicxml-optimizer.js';
import fs from 'fs/promises';
import path from 'path';

const program = new Command();

program
  .name('musical-example-generator')
  .description('Generate sliced musical examples from MusicXML')
  .option('-f, --file <path>', 'Path to local MusicXML file')
  .option('-u, --url <url>', 'URL to fetch MusicXML from')
  .option('-o, --output <path>', 'Path to save output SVG')
  .option('-s, --start <measure>', 'Start measure number', parseInt)
  .option('-e, --end <measure>', 'End measure number', parseInt)
  .option('-p, --part <id>', 'Part ID to extract (e.g., P1)')
  .option('-S, --staff <number>', 'Staff number to extract (e.g., 1)', parseInt)
  .action(async (options) => {
    try {
      // Input Validation
      if (!options.file && !options.url) {
        console.error('Error: Either --file or --url must be provided.');
        process.exit(1);
      }
      if (!options.output) {
        console.error('Error: --output <path> is required.');
        process.exit(1);
      }

      let xmlContent: string;

      // 1. Acquisition
      if (options.file) {
        console.log(`Loading local file: ${options.file}`);
        const xmlBuffer = await fs.readFile(options.file);
        xmlContent = xmlBuffer.toString();
      } else {
        console.log(`Downloading from URL: ${options.url}`);
        // For URL, we might need a temp file or just keep in memory if downloadMusicXML supports returning string.
        // Current downloadMusicXML writes to file. Let's use a temp path.
        const tempPath = path.join(process.cwd(), 'temp_source', 'downloaded.musicxml');
        await fs.mkdir(path.dirname(tempPath), { recursive: true });
        await downloadMusicXML(options.url, tempPath);
        const xmlBuffer = await fs.readFile(tempPath);
        xmlContent = xmlBuffer.toString();
      }

      // 2. Slicing (Optional)
      if (options.start || options.end || options.part || options.staff) {
        console.log(`Slicing config: Measures ${options.start}-${options.end}, Part: ${options.part}, Staff: ${options.staff}`);
        xmlContent = sliceMusicXML(xmlContent, {
          startMeasure: options.start,
          endMeasure: options.end,
          partId: options.part,
          staffNumber: options.staff,
        });
      }

      // 3. Optimization
      console.log('Optimizing MusicXML...');
      const optimizer = new MusicXMLOptimizer();
      
      // フィルタリング（単一スコア化）が行われている場合、視覚的最適化を有効にする
      const isExtractionMode = !!(options.part || options.staff);
      
      const optimizedXml = optimizer.optimize(xmlContent, {
        removePartGroups: isExtractionMode, // 単一譜表ならブレース削除
        resetPositioning: true,             // 常に配置リセット（Verovioの自動配置を信頼）
        alignDynamics: true,                // 常に強弱記号を最適化
      });

      // Validating/Debugging: Save optimized XML
      const debugXmlPath = options.output.replace('.svg', '.debug.xml');
      console.log(`Saving optimized XML to: ${debugXmlPath}`);
      await fs.writeFile(debugXmlPath, optimizedXml);

      // 4. Rendering
      console.log('Rendering to SVG...');
      const svg = await renderToSVG(optimizedXml);
      
      const outputPath = options.output;
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await saveSVG(svg, outputPath);

      console.log(`Success! SVG saved to: ${outputPath}`);
      process.exit(0);

    } catch (error) {
      console.error('Workflow failed:', error);
      process.exit(1);
    }
  });

program.parse();
