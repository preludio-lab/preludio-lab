import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FsContentRepository } from './FsContentRepository';
import fs from 'fs';
import path from 'path';

// Mock fs and gray-matter is not easy to mock directly if it's default export,
// allows verify integration of gray-matter by mocking fs only (read real string).
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn(),
    // Add other methods if needed, or spread actual if partial mocking
  },
  // Support named imports as well
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
}));
vi.mock('@/infrastructure/logging/pino-logger', () => {
  return {
    PinoLogger: class {
      warn = vi.fn();
      error = vi.fn();
      info = vi.fn();
      debug = vi.fn();
    },
  };
});

describe('FsContentRepository', () => {
  let repository: FsContentRepository;
  // Mock data
  const validMdx = `---
title: "Test Title"
date: "2024-01-01"
category: "Introduction"
startSeconds: 10
endSeconds: 60
---
# Content Body`;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new FsContentRepository();
  });

  describe('getContentDetailBySlug', () => {
    it('should return null if file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await repository.getContentDetailBySlug('en', 'works', ['missing']);
      expect(result).toBeNull();
    });

    it('should return ContentDetail if file exists and valid', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(validMdx);

      const result = await repository.getContentDetailBySlug('en', 'works', ['valid']);

      expect(result).not.toBeNull();
      expect(result?.metadata.title).toBe('Test Title');
      expect(result?.body).toContain('# Content Body');
      expect(result?.metadata.startSeconds).toBe(10);
      expect(result?.slug).toBe('valid');
    });
  });

  describe('getContentSummariesByCategory', () => {
    it('should return empty array if directory does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const result = await repository.getContentSummariesByCategory('en', 'works');
      expect(result).toHaveLength(0);
    });
  });
});
