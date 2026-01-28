import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export async function downloadMusicXML(url: string, outputPath: string): Promise<void> {
  console.log(`Downloading MusicXML from: ${url}`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, response.data);
  console.log(`Saved to: ${outputPath}`);
}
