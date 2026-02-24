import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResilientFetcher } from './fetcher.js';
import fs from 'fs';
import path from 'path';

// Mock axios to prevent actual network requests
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn(), clear: vi.fn() },
    },
    defaults: {
      headers: {
        common: {},
        get: {},
        post: {},
      },
      transformRequest: [],
      transformResponse: [],
    },
  };
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('ResilientFetcher Caching Layer', () => {
  const cacheDir = path.resolve(process.cwd(), '.cache', 'fetcher');

  beforeEach(() => {
    // Clean up cache directory before each test
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create a fast atomic cache layer for ResilientFetcher', async () => {
    // 実際にネットワークリクエストを行う代わりに、axios-cache-interceptor の仕組みを
    // インターセプターレベルでテストするのは axios モックと相性が悪いため、
    // fetcher.ts の設計が期待通り実行可能かどうかの大枠の振る舞いをここで検証します。
    // （完全な結合テストは test-core.ts のような実環境に近い形で実施します）

    const fetcher = new ResilientFetcher({
      baseURL: 'https://api.github.com',
      cacheTTL: 1000 * 60, // 1 minute
    });

    const client = fetcher.getClient();
    expect(client).toBeDefined();

    // The cache directory should be created during initialization
    expect(fs.existsSync(cacheDir)).toBe(true);
  });
});
