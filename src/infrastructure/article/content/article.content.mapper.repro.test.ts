import { describe, it, expect, vi, afterEach } from 'vitest';
import { ArticleContentMapper } from './article.content.mapper';
import { logger } from '@/infrastructure/logging';
import matter from 'gray-matter';

// Modules to mock
vi.mock('@/infrastructure/logging', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('gray-matter', () => ({
  default: vi.fn(),
}));

describe('ArticleContentMapper Reproduction & Edge Cases', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should strip frontmatter from MDX content (Normal case)', () => {
    // Setup mock for success
    vi.mocked(matter).mockReturnValue({
      content: '# Hello World\nThis is the content.',
      data: { title: 'Test Title' },
    } as Partial<ReturnType<typeof matter>> as ReturnType<typeof matter>);

    const rawMdx = `---
title: "Test Title"
---
# Hello World
This is the content.`;

    const result = ArticleContentMapper.toDomain(rawMdx, undefined, 'test-slug');

    expect(result.body?.trim()).toBe('# Hello World\nThis is the content.');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should fallback to regex strip if gray-matter throws (Fallback Level 1)', () => {
    // Setup mock to throw
    vi.mocked(matter).mockImplementation(() => {
      throw new Error('YAML Parse Error');
    });

    const rawMdx = `---
title: "Broken YAML"
  indentation: error
---
# Hello World
Recovered Content`;

    const result = ArticleContentMapper.toDomain(rawMdx, undefined, 'test-slug-fallback-1');

    // Should recover content using regex
    expect(result.body?.trim()).toBe('# Hello World\nRecovered Content');
    // Should verify warning was logged? Implementation logs warn on recovery?
    // Checking implementation: yes, logger.warn is called.
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Recovered from gray-matter failure'),
    );
    // Error log for the initial failure
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to parse MDX frontmatter'),
      expect.anything(),
    );
  });

  it('should return empty string if frontmatter is corrupted (Fallback Level 2 - Fail Safe)', () => {
    vi.mocked(matter).mockImplementation(() => {
      throw new Error('YAML Parse Error');
    });

    const rawMdx = `---
title: "Unclosed Frontmatter
# Hello World`;

    const result = ArticleContentMapper.toDomain(rawMdx, undefined, 'test-slug-corrupt');

    expect(result.body).toBe('');
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Frontmatter corrupted'));
  });

  it('should return original content if it does not look like frontmatter (Fallback Level 2 - Normal MD)', () => {
    vi.mocked(matter).mockImplementation(() => {
      throw new Error('Random Error');
    });

    const rawMdx = `# Just Markdown
No frontmatter start.`;

    const result = ArticleContentMapper.toDomain(rawMdx, undefined, 'test-slug-normal');

    expect(result.body).toBe(rawMdx);
    // Should still log the initial error
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to parse MDX frontmatter'),
      expect.anything(),
    );
  });
});
