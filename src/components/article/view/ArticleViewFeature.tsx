import Link from 'next/link';
import { ArticleDto, ArticleMetadataDto } from '@/application/article/dto/ArticleDto';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getTranslations } from 'next-intl/server';
import { ArticleTableOfContents } from './ArticleTableOfContents';
import { ArticleSeriesNavigation } from './ArticleSeriesNavigation';
import { createArticleMdxComponents } from './ArticleMdxComponents';
import rehypeSlug from 'rehype-slug';
import { ArticleYoutubePlayer } from './ArticleYoutubePlayer';
import { ArticleListeningGuide } from './ArticleListeningGuide';
import { Playback } from '@/domain/article/ArticleMetadata';

interface ArticleViewFeatureProps {
    article: ArticleDto;
    prevContent: ArticleMetadataDto | null;
    nextContent: ArticleMetadataDto | null;
}

/**
 * ArticleViewFeature
 * 最新のArticleDtoに対応した記事詳細ページコンポーネント。
 */
export async function ArticleViewFeature({
    article,
    prevContent,
    nextContent,
}: ArticleViewFeatureProps) {
    const t = await getTranslations('CategoryIndex');
    const tNav = await getTranslations('Navigation');
    const { metadata, control, content } = article;
    const { category } = metadata;
    const { lang } = control;

    const hasAudio = !!metadata.playback?.audioSrc;

    const audioMetadata = hasAudio
        ? {
            src: metadata.playback!.audioSrc,
            title: metadata.displayTitle,
            composerName: metadata.composerName,
            performer: metadata.playback!.performer,
            thumbnail: metadata.thumbnail,
            startSeconds: metadata.playback!.startSeconds,
            endSeconds: metadata.playback!.endSeconds,
            platform: 'youtube',
        }
        : undefined;

    const mdxComponents = createArticleMdxComponents(audioMetadata);

    return (
        <div className="container mx-auto px-4 py-32 max-w-7xl">
            {/* パンくずリスト */}
            <nav className="text-sm rounded-md mb-8 flex items-center gap-2 text-tertiary">
                <Link href={`/${lang}`} className="hover:text-primary transition-colors">
                    {tNav('home')}
                </Link>
                <span>/</span>
                <Link
                    href={`/${lang}/${category}`}
                    className="hover:text-primary transition-colors capitalize"
                >
                    {t(`categories.${category}`)}
                </Link>
                <span>/</span>
                <span className="text-primary font-medium truncate">{metadata.displayTitle}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* メインコンテンツ */}
                <article className="lg:col-span-8 prose prose-neutral max-w-none">
                    <header className="mb-12 not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary/10">
                                {category.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-tertiary font-bold tracking-widest uppercase">
                                Difficulty {metadata.readingLevel || metadata.performanceDifficulty || 3}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-6 leading-tight font-serif">
                            {metadata.displayTitle}
                        </h1>
                        <div className="flex items-center gap-4 text-tertiary text-sm font-medium">
                            <time dateTime={metadata.publishedAt?.toISOString()}>
                                {metadata.publishedAt instanceof Date
                                    ? metadata.publishedAt.toISOString().split('T')[0]
                                    : (metadata.publishedAt as unknown as string)?.split('T')[0]}
                            </time>
                            {metadata.composerName && (
                                <>
                                    <span className="w-1 h-1 bg-divider rounded-full" />
                                    <span>
                                        <span className="font-bold text-primary mr-1">{tNav('composers')}:</span>
                                        {metadata.composerName}
                                    </span>
                                </>
                            )}
                        </div>
                    </header>

                    {/* モバイル用目次 */}
                    <div className="lg:hidden mb-12 not-prose">
                        <details className="group bg-neutral-50 rounded-2xl border border-divider overflow-hidden">
                            <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-sm uppercase tracking-wider text-primary select-none">
                                <span>Table of Contents</span>
                                <span className="transition-transform group-open:rotate-180">▼</span>
                            </summary>
                            <div className="p-4 pt-0 border-t border-divider">
                                <ArticleTableOfContents items={content.structure} variant="minimal" />
                            </div>
                        </details>
                    </div>

                    <MDXRemote
                        source={content.body}
                        components={mdxComponents as any}
                        options={{
                            mdxOptions: {
                                rehypePlugins: [rehypeSlug],
                            },
                        }}
                    />

                    <ArticleSeriesNavigation prev={prevContent} next={nextContent} lang={lang} />
                </article>

                {/* デスクトップ用サイドバー */}
                <aside className="hidden lg:block lg:col-span-4 lg:col-start-9">
                    <div className="sticky top-28 space-y-8">
                        {hasAudio && (
                            <div>
                                <ArticleYoutubePlayer playback={metadata.playback as Playback} />
                                <ArticleListeningGuide />
                            </div>
                        )}
                        <div>
                            <ArticleTableOfContents items={content.structure} />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
