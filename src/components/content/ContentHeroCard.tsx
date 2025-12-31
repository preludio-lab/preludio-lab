'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ContentSummary } from '@/domain/content/Content';
import { m } from 'framer-motion';

export interface ContentHeroCardProps {
  content: ContentSummary;
  description: string;
  readMoreLabel: string;
  categoryLabel?: string;
}

/**
 * 注目記事（Featured）に使用する大型のヒーローカードコンポーネント
 */
export function ContentHeroCard({
  content,
  description,
  readMoreLabel,
  categoryLabel,
}: ContentHeroCardProps) {
  const { lang, category, slug, metadata } = content;

  return (
    <m.div className="mx-auto mb-12 max-w-4xl overflow-hidden rounded-2xl bg-paper-white shadow-xl transition-shadow duration-300 hover:shadow-2xl">
      <div className="p-8 sm:p-12">
        {metadata.thumbnail && (
          <div className="relative h-64 w-full sm:h-80 md:h-96">
            <Image
              src={content.metadata.thumbnail || '/images/placeholders/sheet-music-hero.jpg'}
              alt={`${content.metadata.title} - ${content.metadata.composer}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 896px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            {categoryLabel || category.toUpperCase()}
          </div>
        )}
        <h3 className="mb-4 text-3xl font-bold text-gray-900">{metadata.title}</h3>
        <p className="mb-6 text-gray-600">{description}</p>
        <div className="flex flex-wrap gap-4">
          <Link
            href={`/${lang}/${category}/${slug}`}
            className="inline-flex items-center text-blue-600 hover:underline"
          >
            {readMoreLabel} &rarr;
          </Link>
        </div>
      </div>
    </m.div>
  );
}
