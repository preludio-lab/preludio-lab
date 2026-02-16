import { describe, it, expect, vi, beforeEach } from 'vitest';
import { R2StorageService } from './r2.storage';
import { r2Client } from './r2.client';
import { ObjectNotFoundError, StorageError } from './storage.interface';

vi.mock('./r2.client', () => ({
  r2Client: {
    send: vi.fn(),
  },
}));

describe('R2StorageService', () => {
  let service: R2StorageService;

  beforeEach(() => {
    service = new R2StorageService('test-bucket', 'prefix/');
    vi.clearAllMocks();
  });

  it('should return object content if found', async () => {
    const mockResponse = {
      Body: {
        transformToString: vi.fn().mockResolvedValue('r2 content'),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(r2Client.send).mockResolvedValue(mockResponse as any);

    const result = await service.get('key/path.mdx');

    expect(result).toBe('r2 content');
    expect(r2Client.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Key: 'prefix/key/path.mdx',
        }),
      }),
    );
  });

  it('should throw ObjectNotFoundError if NoSuchKey error occurs', async () => {
    // NoSuchKey can be an instance or have a name property
    const error = new Error('Not Found');
    error.name = 'NoSuchKey';
    vi.mocked(r2Client.send).mockRejectedValue(error);

    await expect(service.get('missing.mdx')).rejects.toThrow(ObjectNotFoundError);
  });

  it('should throw StorageError on other R2 errors', async () => {
    vi.mocked(r2Client.send).mockRejectedValue(new Error('Network Error'));

    await expect(service.get('error.mdx')).rejects.toThrow(StorageError);
  });
});
