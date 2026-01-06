'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArticleMetadataDto } from '@/application/article/dto/ArticleDto';
import { m } from 'framer-motion';
import { YoutubeMediaAdapter } from '@/infrastructure/article/YoutubeMediaAdapter';
import { useMemo } from 'react';

export interface ArticleCardProps {
    content: ArticleMetadataDto;
    readMoreLabel: string;
    categoryLabel?: string;
    index?: number;
    priority?: boolean;
}

/**
 * ArticleCard
 * 最新のArticleMetadataDtoに対応したコンテンツカード。
 */
export function ArticleCard({
    content,
    readMoreLabel,
    categoryLabel,
    index = 0,
    priority = false,
}: ArticleCardProps) {
    const t = useTranslations('CategoryIndex');
    const { lang, category, slug, displayTitle, composerName, tags, publishedAt, readingLevel, performanceDifficulty } = content;

    // Thumbnail management with fallback
    const thumbnail = useMemo(() => {
        let url = content.thumbnail;
        const audioSrc = content.playback?.audioSrc;
        if (!url && audioSrc) {
            url = YoutubeMediaAdapter.getStandardThumbnailUrl(audioSrc);
        }
        return url;
    }, [content.thumbnail, content.playback?.audioSrc]);

    const level = readingLevel || performanceDifficulty || 3;
    const dateObj = publishedAt ? (typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt) : null;
    const formattedDate = dateObj ? dateObj.toISOString().split('T')[0] : '';

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group bg-white/40 backdrop-blur-md rounded-3xl overflow-hidden border border-divider shadow-sm hover:shadow-xl hover:border-accent/30 transition-all duration-500 h-full flex flex-col"
        >
            {/* Thumbnail Area */}
            <Link href={`/${lang}/${category}/${slug}`} className="relative block h-56 w-full overflow-hidden">
                {thumbnail ? (
                    <Image
                        src={thumbnail}
                        alt={displayTitle}
                        fill
                        priority={priority}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <span className="text-slate-300 font-serif text-4xl">P</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-primary rounded-full shadow-sm border border-neutral-100">
                        {categoryLabel || t(`categories.${category}`)}
                    </span>
                </div>
            </Link>

            {/* Content Area */}
            <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-tertiary/60 tracking-widest uppercase">
                        {formattedDate}
                    </span>
                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[9px] font-bold rounded-md uppercase tracking-tighter border border-neutral-200/50">
                        Difficulty {level}
                    </span>
                </div>

                <Link href={`/${lang}/${category}/${slug}`} className="block group/title">
                    <h3 className="text-xl font-bold text-primary mb-2 line-clamp-2 leading-snug group-hover/title:text-accent transition-colors font-serif">
                        {displayTitle}
                    </h3>
                    <p className="text-sm text-tertiary mb-4 font-medium italic">
                        {composerName}
                    </p>
                </Link>

                {/* Tags */}
                <div className="mt-auto pt-4 flex flex-wrap gap-2">
                    {tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] text-tertiary/60 font-medium px-2 py-0.5 bg-neutral-50/50 rounded-md border border-neutral-100">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </m.div>
    );
}
