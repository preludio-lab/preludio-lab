import fs from 'fs';
import matter from 'gray-matter';

export class FsArticleContentDataSource {
  async getContent(filePath: string): Promise<string> {
    if (!fs.existsSync(filePath)) return '';
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { content } = matter(fileContents);
    return content;
  }
}
