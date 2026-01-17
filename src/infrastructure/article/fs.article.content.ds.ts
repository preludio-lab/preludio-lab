import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import {
  IArticleContentDataSource,
  ContentNotFoundError,
  ContentFetchError,
} from './interfaces/article.content.data.source.interface';

export class FsArticleContentDataSource implements IArticleContentDataSource {
  private readonly contentDirectory: string;

  constructor(contentDir?: string) {
    this.contentDirectory = contentDir || path.join(process.cwd(), 'article');
  }

  async getContent(filePath: string): Promise<string> {
    try {
      // Resolve path: if absolute use as is, else resolve relative to content root
      let resolvedPath = filePath;
      if (!path.isAbsolute(filePath)) {
        resolvedPath = path.join(this.contentDirectory, filePath);
      }

      if (!fs.existsSync(resolvedPath)) {
        throw new ContentNotFoundError(filePath);
      }

      const fileContents = fs.readFileSync(resolvedPath, 'utf8');
      const { content } = matter(fileContents);
      return content;
    } catch (err) {
      if (err instanceof ContentNotFoundError) {
        throw err;
      }
      throw new ContentFetchError(`Failed to read content from ${filePath}`, err);
    }
  }
}
