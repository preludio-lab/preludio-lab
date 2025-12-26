import { FsContentRepository } from '@/infrastructure/content/FsContentRepository';
import { ContentDetailFeature } from '@/components/content/ContentDetailFeature';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import GithubSlugger from 'github-slugger';
import { LOCALES } from '@/lib/constants';
import { supportedLocales } from '@/domain/i18n/Locale';
import { SUPPORTED_CATEGORIES } from '@/domain/content/ContentConstants';
import { ContentDetail, ContentSummary } from '@/domain/content/Content';

type Props = {
    params: Promise<{
        lang: string;
        category: string;
        slug: string[];
    }>;
};

/**
 * サポートされている全言語およびカテゴリにわたる、全てのコンテンツページの静的生成。
 */
export async function generateStaticParams() {
    const repository = new FsContentRepository();
    const params: { lang: string; category: string; slug: string[] }[] = [];

    for (const lang of LOCALES) {
        // 全てのサポート対象カテゴリを反復処理してパラメータを生成
        for (const category of SUPPORTED_CATEGORIES) {
            try {
                const contents = await repository.getContentSummariesByCategory(lang, category);
                for (const content of contents) {
                    params.push({
                        lang,
                        category,
                        slug: content.slug.split('/'),
                    });
                }
            } catch (e) {
                // コンテンツが存在しないカテゴリやエラーはビルド時に無視
            }
        }
    }
    return params;
}

/**
 * 目次(TOC)のためにMDXコンテンツから見出し（h2, h3）を抽出するユーティリティ。
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
 * 全てのコンテンツ詳細ページのための動的ルート。
 * レポジトリからコンテンツ詳細を取得し、ContentDetailFeature をレンダリングします。
 */
export default async function ContentDetailPage({ params }: Props) {
    const { lang, category, slug } = await params;

    const repository = new FsContentRepository();

    let content: ContentDetail | null = null;
    let allContents: ContentSummary[] = [];

    try {
        content = await repository.getContentDetailBySlug(lang, category, slug);
        if (content) {
            allContents = await repository.getContentSummariesByCategory(lang, category);
        }
    } catch (error) {
        console.error('Error fetching content detail:', error);
    }

    if (!content) {
        notFound();
    }

    const toc = extractHeadings(content.body);

    // シリーズナビゲーション（前/次）のためにソートして対象を特定
    const sortedContents = allContents.sort((a, b) => a.metadata.title.localeCompare(b.metadata.title, lang));
    const currentIndex = sortedContents.findIndex((c) => c.slug === content!.slug);
    const prevContent = currentIndex > 0 ? sortedContents[currentIndex - 1] : null;
    const nextContent = currentIndex < sortedContents.length - 1 ? sortedContents[currentIndex + 1] : null;

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
 * コンテンツ詳細ページのメタデータを生成。
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { lang, category, slug } = await params;
    const repository = new FsContentRepository();
    const content = await repository.getContentDetailBySlug(lang, category, slug);

    if (!content) return {};

    const slugStr = Array.isArray(slug) ? slug.join('/') : slug;

    // SEO: このコンテンツ詳細ページ固有のalternates（canonicalとhreflang）を動的に生成
    const languages: Record<string, string> = {};
    supportedLocales.forEach((locale) => {
        languages[locale] = `/${locale}/${category}/${slugStr}`;
    });
    languages['x-default'] = `/en/${category}/${slugStr}`;

    return {
        title: `${content.metadata.title} | Preludio Lab`,
        description: content.metadata.ogp_excerpt || `Discover more about ${content.metadata.title} on Preludio Lab.`,
        alternates: {
            canonical: `/${lang}/${category}/${slugStr}`,
            languages,
        },
    };
}
