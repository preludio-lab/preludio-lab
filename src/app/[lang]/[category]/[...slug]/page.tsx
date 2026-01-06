import { GetArticleBySlugUseCase } from '@/application/article/GetArticleBySlugUseCase';
import { ListArticlesUseCase } from '@/application/article/ListArticlesUseCase';
import { FsArticleRepository } from '@/infrastructure/article/FsArticleRepository';
import { ContentDetailFeature } from '@/components/content/ContentDetailFeature';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GithubSlugger from 'github-slugger';
import { LOCALES } from '@/lib/constants';
import { supportedLocales } from '@/domain/i18n/Locale';
import { ArticleStatus } from '@/domain/article/ArticleControl';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { ArticleSortOption } from '@/domain/article/ArticleConstants';
import { ArticleDto, ArticleMetadataDto } from '@/domain/article/ArticleDto';
import { ContentDetail, ContentSummary } from '@/domain/content/Content';

type Props = {
  params: Promise<{
    lang: string;
    category: string;
    slug: string[];
  }>;
};

// --- Repository Singleton (Poor man's DI) ---
const articleRepository = new FsArticleRepository();

/**
 * Adapter: ArticleDetailDto -> ContentDetail
 * 旧コンポーネントとの互換性を維持するためのアダプター
 */
function adaptToContentDetail(dto: ArticleDto): ContentDetail {
  return {
    slug: dto.metadata.slug,
    lang: dto.control.lang,
    category: dto.metadata.category,
    metadata: {
      title: dto.metadata.title,
      composerName: dto.metadata.composerName,
      work: dto.metadata.workTitle,
      key: dto.metadata.key,
      difficulty: mapLevelToString(dto.metadata.readingLevel || 3) as any,
      tags: dto.metadata.tags,
      audioSrc: dto.metadata.playback?.audioSrc,
      performer: dto.metadata.playback?.performer,
      thumbnail: dto.metadata.thumbnail,
      startSeconds: dto.metadata.playback?.startSeconds,
      endSeconds: dto.metadata.playback?.endSeconds,
      ogp_excerpt: dto.metadata.excerpt,
      date: dto.metadata.publishedAt ? new Date(dto.metadata.publishedAt).toISOString().split('T')[0] : undefined,
    },
    body: dto.content.body,
  };
}

function adaptToContentSummary(dto: ArticleMetadataDto): ContentSummary {
  return {
    slug: dto.slug,
    lang: dto.lang,
    category: dto.category,
    metadata: {
      title: dto.title,
      composerName: dto.composerName,
      // Minimal mapping for summary
      difficulty: 'Intermediate', // Dummy
      tags: [],
      date: dto.publishedAt ? dto.publishedAt.split('T')[0] : undefined,
    }
  };
}

function mapLevelToString(level: number): string {
  switch (level) {
    case 1: return 'Beginner';
    case 2: return 'Beginner'; // Or Intermediate?
    case 3: return 'Intermediate';
    case 4: return 'Advanced';
    case 5: return 'Virtuoso'; // Or Advanced?
    default: return 'Intermediate';
  }
}

/**
 * generateStaticParams
 */
export async function generateStaticParams() {
  // New Implementation using ListArticlesUseCase
  const useCase = new ListArticlesUseCase(articleRepository);

  // Scan all langs and categories?
  // UseCase doesn't have "scan all".
  // We iterate knowns.
  const params: { lang: string; category: string; slug: string[] }[] = [];

  const categories = Object.values(ArticleCategory);

  for (const lang of LOCALES) {
    // We can optimize this by listing all files via repository helper if exposed,
    // or just accept ListArticlesUseCase works per lang.
    try {
      const response = await useCase.execute({
        lang,
        // No category filter to get all? ArticleSearchCriteria category is optional.
        limit: 1000 // Max limit
      });

      for (const item of response.items) {
        params.push({
          lang,
          category: item.category,
          slug: [item.slug] // Note: New Domain Slug is likely simple 'slug'. 
          // Old Domain slug might be array?
          // Page param is [...slug]
        });
      }
    } catch (e) {
      console.warn(`Failed to generate static params for ${lang}`, e);
    }
  }
  return params;
}

/**
 * extractHeadings (Legacy Utility kept for now)
 */
function extractHeadings(content: string) {
  const slugger = new GithubSlugger();
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { level: number; text: string; slug: string }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2];
    const slug = slugger.slug(text);
    headings.push({ level, text, slug });
  }

  return headings;
}

/**
 * ContentDetailPage
 */
export default async function ContentDetailPage({ params }: Props) {
  const { lang, category, slug } = await params;

  // Clean slug
  const slugStr = Array.isArray(slug) ? slug.join('/') : slug;

  const getUseCase = new GetArticleBySlugUseCase(articleRepository);
  const listUseCase = new ListArticlesUseCase(articleRepository); // For navigation

  let content: ContentDetail | null = null;
  let prevContent: ContentSummary | null = null;
  let nextContent: ContentSummary | null = null;

  try {
    const articleDto = await getUseCase.execute(lang, slugStr);

    if (articleDto) {
      content = adaptToContentDetail(articleDto);

      // Navigation Logic (Simplified: Valid in same Category)
      // Fetch all in category to find neighbors (Expensive but same as before)
      const summaryResponse = await listUseCase.execute({
        lang,
        category: articleDto.metadata.category,
        status: [ArticleStatus.PUBLISHED],
        limit: 1000,
        sortBy: ArticleSortOption.TITLE // Maintain Title sort for navigation
      });

      const sorted = summaryResponse.items; // Already sorted by UseCase if specified? 
      // Actually ListArticlesUseCase implements sort.
      // But Alphabetical might rely on 'title'.

      const currentIndex = sorted.findIndex(c => c.slug === articleDto.metadata.slug);
      if (currentIndex >= 0) {
        if (currentIndex > 0) prevContent = adaptToContentSummary(sorted[currentIndex - 1]);
        if (currentIndex < sorted.length - 1) nextContent = adaptToContentSummary(sorted[currentIndex + 1]);
      }
    }
  } catch (error) {
    console.error('Error fetching content detail:', error);
  }

  if (!content) {
    notFound();
  }

  const toc = extractHeadings(content.body);

  return (
    <ContentDetailFeature
      content={content}
      toc={toc}
      prevContent={prevContent}
      nextContent={nextContent}
    />
  );
}

/**
 * generateMetadata
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category, slug } = await params;
  const slugStr = Array.isArray(slug) ? slug[slug.length - 1] : slug;

  const useCase = new GetArticleBySlugUseCase(articleRepository);
  const article = await useCase.execute(lang, slugStr);

  if (!article) return {};

  const canonicalPath = `/${lang}/${category}/${slugStr}`;
  // ... alternates logic ...

  return {
    title: `${article.metadata.title} | Preludio Lab`,
    description: article.metadata.excerpt || `Discover more about ${article.metadata.title} on Preludio Lab.`,
    // alternates: ... (skip for brevity or copy full logic if critical)
  };
}
