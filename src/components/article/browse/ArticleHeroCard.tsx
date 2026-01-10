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
      initial="initial"
      animate="animate"
      whileHover="hover"
      variants={{
        initial: { opacity: 0, y: 30 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] },
        },
        hover: {
          y: -4,
          transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className="group mx-auto mb-12 max-w-4xl overflow-hidden rounded-[2.5rem] bg-paper-white border border-neutral-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-[box-shadow,border-color] duration-300"
    >
      <Link href={`/${lang}/${category}/${slug}`} className="block h-full">
        <div className="p-8 sm:p-12">
          <div className="relative h-64 w-full sm:h-80 md:h-96 mb-8 overflow-hidden rounded-xl">
            <Image
              src={thumbnail || '/images/placeholders/article-placeholder.webp'}
              alt={`${title} - ${composerName}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 896px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute bottom-4 left-4">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-primary rounded-full shadow-sm">
                {categoryLabel || category.toUpperCase()}
              </span>
            </div>
          </div>
          <h3 className="mb-4 text-3xl font-bold text-gray-900 font-serif leading-tight transition-colors duration-300">
            {title}
          </h3>
          <div className="flex flex-col mb-6">
            <p className="text-primary font-medium italic mb-2">{composerName}</p>
            <p className="text-gray-600 line-clamp-3 leading-relaxed">{description}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="inline-flex items-center px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-full transition-all shadow-md shadow-primary/20 group-hover:bg-primary-dark group-hover:shadow-lg">
              {readMoreLabel}
              <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                &rarr;
              </span>
            </div>
          </div>
        </div>
      </Link>
    </m.div>
  );
}
