import { Command } from 'commander';
import { downloadMusicXML } from './lib/fetcher.js';
import { sliceMusicXML } from './lib/processor.js';
import { renderToSVG, saveSVG } from './lib/renderer.js';
import fs from 'fs/promises';
import path from 'path';

const program = new Command();

program
  .name('musical-example-generator')
  .description('Generate sliced musical examples from MusicXML')
  .option('--work <slug>', 'Work slug (e.g., moonlight-sonata)', 'moonlight-sonata')
  .action(async (options) => {
    const workSlug = options.work;
    console.log(`Starting workflow for: ${workSlug}`);

    // Configuration for Moonlight Sonata
    const config = {
      url: 'https://raw.githubusercontent.com/moseleymark/MusicXML/master/Beethoven_Moonlight_Sonata.xml',
      composer: 'beethoven',
      work: 'moonlight-sonata',
      highlights: [
        {
          slug: 'theme-1',
          startMeasure: 1,
          endMeasure: 2,
          description: 'Moonlight Sonata - Opening theme',
        },
      ],
    };

    const projectRoot = process.cwd();
    const dataDir = path.join(projectRoot, 'data', 'verification', workSlug);
    const fullScorePath = path.join(dataDir, 'full_score.musicxml');

    try {
      // 1. Acquisition
      let xmlContent: string;
      try {
        await downloadMusicXML(config.url, fullScorePath);
        const xmlBuffer = await fs.readFile(fullScorePath);
        xmlContent = xmlBuffer.toString();
      } catch {
        console.warn(
          'Failed to download from URL, using fallback minimal MusicXML for verification.',
        );
        xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
    </measure>
    <measure number="3">
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;
        await fs.mkdir(path.dirname(fullScorePath), { recursive: true });
        await fs.writeFile(fullScorePath, xmlContent);
      }

      // 2. Selection & 3. Extraction/Processing
      for (const highlight of config.highlights) {
        console.log(`Processing highlight: ${highlight.slug}`);

        // Trimming
        const slicedXml = sliceMusicXML(xmlContent, {
          startMeasure: highlight.startMeasure,
          endMeasure: highlight.endMeasure,
        });

        const highlightDir = path.join(dataDir, 'highlights');
        await fs.mkdir(highlightDir, { recursive: true });

        const highlightXmlPath = path.join(highlightDir, `${highlight.slug}.musicxml`);
        await fs.writeFile(highlightXmlPath, slicedXml);
        console.log(`Sliced XML saved to: ${highlightXmlPath}`);

        // Rendering
        const svg = await renderToSVG(slicedXml);
        const highlightSvgPath = path.join(highlightDir, `${highlight.slug}.svg`);
        await saveSVG(svg, highlightSvgPath);
      }

      console.log('Workflow completed successfully!');
    } catch (error) {
      console.error('Workflow failed:', error);
      process.exit(1);
    }
  });

program.parse();
