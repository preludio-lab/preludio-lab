'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArticleMetadataDto } from '@/application/article/dto/ArticleDto';
import { m } from 'framer-motion';

export interface ArticleHeroCardProps {
    content: ArticleMetadataDto;
    description: string;
    readMoreLabel: string;
    categoryLabel?: string;
}

/**
 * ArticleHeroCard
 * 注目記事（Featured）に使用する大型のヒーローカード。最新のArticleMetadataDtoに対応。
 */
export function ArticleHeroCard({
    content,
    description,
    readMoreLabel,
    categoryLabel,
}: ArticleHeroCardProps) {
    const { lang, category, slug, thumbnail, title, composerName } = content;

    return (
        <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto mb-12 max-w-4xl overflow-hidden rounded-2xl bg-paper-white shadow-xl transition-shadow duration-300 hover:shadow-2xl"
        >
            <div className="p-8 sm:p-12">
                {thumbnail && (
                    <div className="relative h-64 w-full sm:h-80 md:h-96 mb-8 group overflow-hidden rounded-xl">
                        <Image
                            src={thumbnail || '/images/placeholders/sheet-music-hero.jpg'}
                            alt={`${title} - ${composerName}`}
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 896px"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-primary rounded-full shadow-sm">
                                {categoryLabel || category.toUpperCase()}
                            </span>
                        </div>
                    </div>
                )}
                <h3 className="mb-4 text-3xl font-bold text-gray-900 font-serif leading-tight">{title}</h3>
                <p className="mb-2 text-primary font-medium italic">{composerName}</p>
                <p className="mb-6 text-gray-600 line-clamp-3">{description}</p>
                <div className="flex flex-wrap gap-4">
                    <Link
                        href={`/${lang}/${category}/${slug}`}
                        className="inline-flex items-center px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary-dark transition-all transform hover:-translate-y-0.5 shadow-md shadow-primary/20"
                    >
                        {readMoreLabel} &rarr;
                    </Link>
                </div>
            </div>
        </m.div>
    );
}
