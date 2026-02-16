import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSystemStorageService } from './fs.storage';
import fs from 'fs';
import { ObjectNotFoundError, StorageError } from './storage.interface';

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

describe('FileSystemStorageService', () => {
  let service: FileSystemStorageService;
  const mockBaseDir = '/mock/base';

  beforeEach(() => {
    service = new FileSystemStorageService(mockBaseDir);
    vi.clearAllMocks();
  });

  it('should return file content if file exists', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('file content');

    const result = await service.get('test.txt');

    expect(result).toBe('file content');
    expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('test.txt'), 'utf8');
  });

  it('should throw ObjectNotFoundError if file does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await expect(service.get('missing.txt')).rejects.toThrow(ObjectNotFoundError);
  });

  it('should throw StorageError on other FS errors', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('Disk failure');
    });

    await expect(service.get('error.txt')).rejects.toThrow(StorageError);
  });
});
