import { describe, it, expect, vi, beforeEach } from 'vitest';
import { R2ArticleContentDataSource } from './r2.article.content.ds';
import { r2Client } from '../storage/r2.client';
import { GetObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import { ContentNotFoundError, ContentFetchError } from './interfaces/article.content.ds.interface';
import { Logger } from '@/shared/logging/logger';

// r2-client モジュールのモック
vi.mock('../storage/r2.client', () => ({
  r2Client: {
    send: vi.fn(),
  },
}));

describe('R2ArticleContentDataSource', () => {
  let dataSource: R2ArticleContentDataSource;
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  beforeEach(() => {
    dataSource = new R2ArticleContentDataSource(mockLogger as unknown as Logger);
    vi.clearAllMocks();
  });

  it('should transform logical path to R2 physical path and return content', async () => {
    const mockContent = '# Hello World';
    const mockBody = {
      transformToString: vi.fn().mockResolvedValue(mockContent),
    };

    vi.mocked(r2Client.send).mockResolvedValue({
      Body: mockBody as unknown as undefined, // Type assertion for S3 output body
    } as never);

    const inputPath = 'ja/works/bach/prelude.mdx';
    const expectedKey = 'private/articles/works/bach/prelude/mdx/ja.mdx';

    const result = await dataSource.getContent(inputPath);

    expect(result).toBe(mockContent);
    expect(r2Client.send).toHaveBeenCalledTimes(1);

    // コマンド引数の検証
    const callArgs = vi.mocked(r2Client.send).mock.calls[0][0];
    expect(callArgs).toBeInstanceOf(GetObjectCommand);
    expect(callArgs.input).toEqual(
      expect.objectContaining({
        Key: expectedKey,
      }),
    );
  });

  it('should use original path if it does not match logical path pattern', async () => {
    const mockContent = '# Legacy';
    const mockBody = { transformToString: vi.fn().mockResolvedValue(mockContent) };
    vi.mocked(r2Client.send).mockResolvedValue({ Body: mockBody as unknown as undefined } as never);

    const rawPath = 'some-folder/file.mdx'; // less than 3 segments
    await dataSource.getContent(rawPath);

    const callArgs = vi.mocked(r2Client.send).mock.calls[0][0];
    // Cast input to any or specific type to avoid TS error
    expect((callArgs.input as { Key: string }).Key).toBe(rawPath);
  });

  it('should use original path if extension is not .mdx', async () => {
    const mockContent = 'text data';
    const mockBody = { transformToString: vi.fn().mockResolvedValue(mockContent) };
    vi.mocked(r2Client.send).mockResolvedValue({ Body: mockBody as unknown as undefined } as never);

    const rawPath = 'ja/works/bach/prelude.txt';
    await dataSource.getContent(rawPath);

    const callArgs = vi.mocked(r2Client.send).mock.calls[0][0];
    expect((callArgs.input as { Key: string }).Key).toBe(rawPath);
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
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('should throw ContentFetchError and log error on other errors', async () => {
    vi.mocked(r2Client.send).mockRejectedValue(new Error('Access Denied'));

    await expect(dataSource.getContent('error.mdx')).rejects.toThrow(ContentFetchError);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should strip frontmatter from content', async () => {
    const mockRawContent = '---\ntitle: Test\n---\n# Actual Content';
    const expectedContent = '# Actual Content';
    const mockBody = {
      transformToString: vi.fn().mockResolvedValue(mockRawContent),
    };

    vi.mocked(r2Client.send).mockResolvedValue({
      Body: mockBody as unknown as undefined,
    } as never);

    const result = await dataSource.getContent('ja/works/bach/prelude.mdx');

    expect(result.trim()).toBe(expectedContent);
  });
});
