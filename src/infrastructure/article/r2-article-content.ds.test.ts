import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArticleContentDataSource } from './r2-article-content.ds';
import { r2Client } from '../storage/r2-client';
import { GetObjectCommand } from '@aws-sdk/client-s3';

// r2-client モジュールのモック
vi.mock('../storage/r2-client', () => ({
  r2Client: {
    send: vi.fn(),
  },
}));

describe('ArticleContentDataSource', () => {
  let dataSource: ArticleContentDataSource;

  beforeEach(() => {
    dataSource = new ArticleContentDataSource();
    vi.clearAllMocks();
  });

  it('should return content string when R2 returns existing object', async () => {
    const mockContent = '# Hello World';
    const mockBody = {
      transformToString: vi.fn().mockResolvedValue(mockContent),
    };

    vi.mocked(r2Client.send).mockResolvedValue({
      Body: mockBody as unknown as undefined, // Type assertion for S3 output body
    } as never);

    const path = 'articles/test.mdx';
    const result = await dataSource.getContent(path);

    expect(result).toBe(mockContent);
    expect(r2Client.send).toHaveBeenCalledTimes(1);

    // コマンド引数の検証
    const callArgs = vi.mocked(r2Client.send).mock.calls[0][0];
    expect(callArgs).toBeInstanceOf(GetObjectCommand);
    expect(callArgs.input).toEqual(
      expect.objectContaining({
        Key: path,
      }),
    );
  });

  it('should return empty string if path is empty', async () => {
    const result = await dataSource.getContent('');
    expect(result).toBe('');
    expect(r2Client.send).not.toHaveBeenCalled();
  });

  it('should return empty string if R2 response has no Body', async () => {
    vi.mocked(r2Client.send).mockResolvedValue({
      Body: undefined,
    } as never);

    const result = await dataSource.getContent('exist-but-empty.mdx');
    expect(result).toBe('');
  });

  it('should return empty string and log warning on error', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(r2Client.send).mockRejectedValue(new Error('Access Denied'));

    const result = await dataSource.getContent('error.mdx');

    expect(result).toBe('');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
