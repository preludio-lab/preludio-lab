import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubScoreSourceRepository } from './github-score-source.repository';
import { InfrastructureError } from '@/domain/shared/app-error';

describe('GitHubScoreSourceRepository', () => {
  let repository: GitHubScoreSourceRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    repository = new GitHubScoreSourceRepository();
    // 全ての setTimeout を即時実行してリトライの待機時間をスキップ
    vi.stubGlobal(
      'setTimeout',
      vi.fn((cb: () => void) => {
        cb();
        return 0 as unknown as NodeJS.Timeout;
      }),
    );
  });

  describe('fetchRawScore', () => {
    const mockScore = {
      id: 'test-id',
      workId: 'work-id',
      workPartId: 'part-id',
      scoreId: 'score-id',
      provider: 'github' as const,
      repositoryOwner: 'craigsapp',
      repositoryName: 'mozart-piano-sonatas',
      commitHash: 'abc1234567890123456789012345678901234567',
      filePath: 'kern/sonata11-1a.krn',
      format: 'kern' as const,
      workPartNumber: 1,
      workPartTitle: 'I. Allegro',
      workPartSlug: '1st-mov',
      license: 'CC0',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully fetch score with correct signature', async () => {
      const mockContent = '!!!!SEGMENT: test.krn\n!!!COM: Mozart\n!!!OTL: Test Sonata';
      const mockResponse = {
        ok: true,
        text: async () => mockContent,
        status: 200,
        statusText: 'OK',
      };

      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      vi.stubGlobal('fetch', fetchMock);

      const content = await repository.fetchRawScore(mockScore);

      expect(content).toBe(mockContent);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(
          'raw.githubusercontent.com/craigsapp/mozart-piano-sonatas/abc1234567890123456789012345678901234567/kern/sonata11-1a.krn',
        ),
        expect.any(Object),
      );
    });

    it('should fail if signature check fails (HTML detected)', async () => {
      const invalidContent = '<html><body>Not a score</body></html>';
      const mockResponse = {
        ok: true,
        text: async () => invalidContent,
        status: 200,
      };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

      await expect(repository.fetchRawScore(mockScore)).rejects.toThrow(
        'Fetched content is HTML, possibly an error page.',
      );
    });

    it('should retry on transient errors (e.g., 503)', async () => {
      const mock503Response = {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      };
      const mockSuccessResponse = {
        ok: true,
        text: async () => '!!!!SEGMENT: test.krn\n!!!COM: Mozart',
        status: 200,
      };

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(mock503Response)
        .mockResolvedValueOnce(mockSuccessResponse);

      vi.stubGlobal('fetch', fetchMock);

      // Disable backoff sleep for tests
      vi.spyOn(global, 'setTimeout').mockImplementation((cb: () => void) => {
        cb();
        return 0 as unknown as NodeJS.Timeout;
      });

      const content = await repository.fetchRawScore(mockScore);

      expect(content).toContain('!!!!SEGMENT');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should mark network errors (TypeError) as transient', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

      try {
        await repository.fetchRawScore(mockScore);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(InfrastructureError);
        if (error instanceof InfrastructureError) {
          expect(error.isTransient).toBe(true);
        }
      }
    });

    it('should not retry on 404 error', async () => {
      const mock404Response = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      };

      const fetchMock = vi.fn().mockResolvedValue(mock404Response);
      vi.stubGlobal('fetch', fetchMock);

      await expect(repository.fetchRawScore(mockScore)).rejects.toThrow('Not Found');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
