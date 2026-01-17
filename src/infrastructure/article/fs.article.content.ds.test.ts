import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FsArticleContentDataSource } from './fs.article.content.ds';
import { ContentNotFoundError } from './interfaces/article.content.ds.interface';
import fs from 'fs';
import path from 'path';

// fs モジュールのモック
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

describe('FsArticleContentDataSource', () => {
  let dataSource: FsArticleContentDataSource;
  const mockContentDir = '/mock/article';

  beforeEach(() => {
    dataSource = new FsArticleContentDataSource(mockContentDir);
    vi.clearAllMocks();
  });

  it('should return content string when file exists (absolute path)', async () => {
    const filePath = '/absolute/path/to/file.mdx';
    const fileContent = '---\ntitle: Test\n---\n# Hello World';

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(fileContent);

    const result = await dataSource.getContent(filePath);

    expect(result).toBe('# Hello World');
    expect(fs.existsSync).toHaveBeenCalledWith(filePath);
    expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
  });

  it('should return content string when file exists (relative path)', async () => {
    const relativePath = 'en/works/test.mdx';
    const expectedPath = path.join(mockContentDir, relativePath);
    const fileContent = '---\ntitle: Test\n---\n# Rel Hello';

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(fileContent);

    const result = await dataSource.getContent(relativePath);

    expect(result).toBe('# Rel Hello');
    expect(fs.existsSync).toHaveBeenCalledWith(expectedPath);
    expect(fs.readFileSync).toHaveBeenCalledWith(expectedPath, 'utf8');
  });

  it('should throw ContentNotFoundError when file does not exist', async () => {
    const filePath = '/path/to/missing.mdx';
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await expect(dataSource.getContent(filePath)).rejects.toThrow(ContentNotFoundError);
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });
});
