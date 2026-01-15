import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FsArticleContentDataSource } from './fs-article-content.ds';
import fs from 'fs';

// fs モジュールのモック
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

describe('FsArticleContentDataSource', () => {
  let dataSource: FsArticleContentDataSource;

  beforeEach(() => {
    dataSource = new FsArticleContentDataSource();
    vi.clearAllMocks();
  });

  it('should return content string when file exists', async () => {
    const filePath = '/path/to/file.mdx';
    const fileContent = '---\ntitle: Test\n---\n# Hello World';

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(fileContent);

    const result = await dataSource.getContent(filePath);

    expect(result).toBe('# Hello World');
    expect(fs.existsSync).toHaveBeenCalledWith(filePath);
    expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8');
  });

  it('should return empty string when file does not exist', async () => {
    const filePath = '/path/to/missing.mdx';
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = await dataSource.getContent(filePath);

    expect(result).toBe('');
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });
});
