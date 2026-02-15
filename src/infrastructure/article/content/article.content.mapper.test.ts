import { describe, it, expect } from 'vitest';
import { ArticleContentMapper } from './article.content.mapper';
import { ArticleContent, ContentStructure } from '@/domain/article/article';

describe('ArticleContentMapper', () => {
  const mockStructure: ContentStructure = [{ id: 'section-1', heading: 'Section 1', level: 2 }];

  describe('toDomain', () => {
    it('should create ArticleContent from raw MDX and structure', () => {
      const rawMdx = '# Hello\n@[path/to/image.svg]';
      const result = ArticleContentMapper.toDomain(rawMdx, mockStructure);

      expect(result).toBeInstanceOf(ArticleContent);
      expect(result.structure).toEqual(mockStructure);
      expect(result.body).toBe(rawMdx);
    });

    it('should dynamically generate structure from MDX if structure is omitted', () => {
      const rawMdx = '## Section A\n### Subset B\n#### Deep C';
      const result = ArticleContentMapper.toDomain(rawMdx);

      expect(result.structure).toHaveLength(3);
      expect(result.structure[0]).toEqual({ id: 'section-a', heading: 'Section A', level: 2 });
      expect(result.structure[1]).toEqual({ id: 'subset-b', heading: 'Subset B', level: 3 });
      expect(result.structure[2]).toEqual({ id: 'deep-c', heading: 'Deep C', level: 4 });
    });

    it('should handle null raw MDX', () => {
      const result = ArticleContentMapper.toDomain(null);

      expect(result).toBeInstanceOf(ArticleContent);
      expect(result.body).toBeNull();
      expect(result.structure).toEqual([]);
    });
  });

  describe('toPersistence', () => {
    it('should extract body from ArticleContent', () => {
      const content = new ArticleContent({
        body: 'some content',
        structure: mockStructure,
      });

      const result = ArticleContentMapper.toPersistence(content);
      expect(result).toBe('some content');
    });

    it('should return null if body is null', () => {
      const content = new ArticleContent({
        body: null,
        structure: mockStructure,
      });

      const result = ArticleContentMapper.toPersistence(content);
      expect(result).toBeNull();
    });
  });
});
