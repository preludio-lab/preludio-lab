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

    it('should dynamically generate hierarchical structure from MDX if structure is omitted', () => {
      const rawMdx = '## Section A\n### Subset B\n#### Deep C\n## Section D';
      const result = ArticleContentMapper.toDomain(rawMdx);

      expect(result.structure).toHaveLength(2); // A and D
      expect(result.structure[0].id).toBe('section-a');
      expect(result.structure[0].children).toHaveLength(1); // Subset B
      expect(result.structure[0].children![0].id).toBe('subset-b');
      expect(result.structure[0].children![0].children).toHaveLength(1); // Deep C
      expect(result.structure[0].children![0].children![0].id).toBe('deep-c');

      expect(result.structure[1].id).toBe('section-d');
    });

    it('should handle Japanese headings and provide hierarchical IDs', () => {
      const rawMdx = '## 楽曲の概要\n### 音楽的な特徴！\n#### 1. イントロダクション\n## 結論';
      const result = ArticleContentMapper.toDomain(rawMdx);

      expect(result.structure).toHaveLength(2);
      expect(result.structure[0].id).toBe('楽曲の概要');
      expect(result.structure[0].children![0].id).toBe('音楽的な特徴');
      expect(result.structure[0].children![0].children![0].id).toBe('1-イントロダクション');
      expect(result.structure[1].id).toBe('結論');
    });

    it('should use fallback ID when heading is composed of only special characters', () => {
      const rawMdx = '## ！！！';
      const result = ArticleContentMapper.toDomain(rawMdx);

      expect(result.structure).toHaveLength(1);
      expect(result.structure[0].id).toBe('section-1');
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
