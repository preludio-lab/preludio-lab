import { describe, it, expect, vi, beforeEach } from 'vitest';
import { R2ArticleContentDataSource } from './r2.article.content.ds';
import { r2Client } from '../storage/r2.client';
import { GetObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import { ContentNotFoundError, ContentFetchError } from './interfaces/article.content.ds.interface';

// r2-client モジュールのモック
vi.mock('../storage/r2.client', () => ({
  r2Client: {
    send: vi.fn(),
  },
}));

describe('R2ArticleContentDataSource', () => {
  let dataSource: R2ArticleContentDataSource;

  beforeEach(() => {
    dataSource = new R2ArticleContentDataSource();
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

  it('should throw ContentNotFoundError if path is empty', async () => {
    await expect(dataSource.getContent('')).rejects.toThrow(ContentNotFoundError);
    expect(r2Client.send).not.toHaveBeenCalled();
  });

  it('should throw ContentFetchError if R2 response has no Body', async () => {
    vi.mocked(r2Client.send).mockResolvedValue({
      Body: undefined,
    } as never);

    await expect(dataSource.getContent('exist-but-empty.mdx')).rejects.toThrow(ContentFetchError);
  });

  it('should throw ContentNotFoundError when R2 throws NoSuchKey error', async () => {
    // AWS SDK throws NoSuchKey for 404
    const noSuchKeyError = new NoSuchKey({
      $metadata: {},
      message: 'The specified key does not exist.',
    });
    vi.mocked(r2Client.send).mockRejectedValue(noSuchKeyError);

    await expect(dataSource.getContent('not-found.mdx')).rejects.toThrow(ContentNotFoundError);
  });

  it('should throw ContentFetchError and log error on other errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(r2Client.send).mockRejectedValue(new Error('Access Denied'));

    await expect(dataSource.getContent('error.mdx')).rejects.toThrow(ContentFetchError);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
