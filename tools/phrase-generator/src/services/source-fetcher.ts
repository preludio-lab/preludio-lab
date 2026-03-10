import axios from 'axios';
import { consola } from 'consola';
import fs from 'fs/promises';
import path from 'path';

export async function downloadMusicXML(url: string, outputPath: string): Promise<void> {
  consola.info(`Downloading MusicXML from: ${url}`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(response.data));
  consola.success(`Saved to: ${outputPath}`);
}
