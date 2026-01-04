'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ContentSummary } from '@/domain/content/Content';
import { m } from 'framer-motion';
import { YoutubeMediaAdapter } from '@/infrastructure/content/YoutubeMediaAdapter';
import { useState, useMemo } from 'react';

export interface ContentCardProps {
  content: ContentSummary;
  readMoreLabel: string;
  categoryLabel?: string;
  index?: number;
  priority?: boolean;
}

/**
 * Enhanced content card with thumbnail support and premium aesthetics.
 * Prioritizes local thumbnail, falls back to YouTube thumbnail if videoId exists.
 * Now supports internationalized badges for Category and Difficulty.
 */
export function ContentCard({
  content,
  readMoreLabel,
  categoryLabel,
  index = 0,
  priority = false,
}: ContentCardProps) {
  const t = useTranslations('CategoryIndex');
  const { lang, category, slug, metadata } = content;

  // Thumbnail management with fallback
  const initialThumbnail = useMemo(() => {
    let url = metadata.thumbnail;
    if (!url && metadata.audioSrc) {
      url = YoutubeMediaAdapter.getStandardThumbnailUrl(metadata.audioSrc);
    }
    return url || '/images/placeholders/default-content.webp';
  }, [metadata.thumbnail, metadata.audioSrc]);

  const [imgSrc, setImgSrc] = useState(initialThumbnail);
  const [imgErrorCount, setImgErrorCount] = useState(0);

  const handleThumbnailError = () => {
    if (!metadata.audioSrc) return;

    const candidates = YoutubeMediaAdapter.getThumbnailUrlCandidates(metadata.audioSrc);
    // next candidate after the one that failed
    if (imgErrorCount < candidates.length - 1) {
      setImgErrorCount((prev) => prev + 1);
      setImgSrc(candidates[imgErrorCount + 1]);
    } else {
      setImgSrc('/images/placeholders/default-content.webp');
    }
  };

  // Labels
  const displayCategory =
    categoryLabel || (t.has(`categories.${category}`) ? t(`categories.${category}`) : category);

  // Difficulty logic
  const difficultyKey = `difficulty.${metadata.difficulty}`;
  const displayDifficulty = metadata.difficulty
    ? t.has(difficultyKey)
      ? t(difficultyKey)
      : metadata.difficulty
    : null;

  return (
    <m.div
      layout
      className="group block h-full bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-100 ease-out hover:-translate-y-1"
      // LCP Optimization: Skip entrance animation for priority items to ensure immediate visibility
      initial={priority ? false : { opacity: 0, y: 20 }}
      whileInView={priority ? undefined : { opacity: 1, y: 0 }}
      viewport={priority ? undefined : { once: true }}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
    >
      <Link href={`/${lang}/${category}/${slug}`} className="flex flex-col h-full">
        {/* Image Area */}
        <div className="relative aspect-video overflow-hidden block">
          <Image
            src={imgSrc}
            alt={`${metadata.title} - ${metadata.composerName || ''}`}
            fill
            priority={priority}
            fetchPriority={priority ? 'high' : 'auto'}
            // LCP Optimization: Refined sizes to account for page padding (approx 32px or 4-8vw)
            // Mobile: 1 col (~92vw), Tablet: 2 cols (~45vw), Desktop: 3 cols (~30vw)
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            onError={handleThumbnailError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Category Badge (Overlay) */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2.5 py-1 rounded-full text-neutral-600 uppercase tracking-wider shadow-sm">
              {displayCategory}
            </span>
          </div>

          {/* Difficulty Badge (Overlay) */}
          {displayDifficulty && (
            <div className="absolute top-3 right-3">
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white tracking-wider shadow-sm ${metadata.difficulty === 'Beginner'
                    ? 'bg-emerald-500'
                    : metadata.difficulty === 'Intermediate'
                      ? 'bg-sky-500'
                      : 'bg-rose-500'
                  }`}
              >
                {displayDifficulty}
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex flex-col flex-grow p-5">
          <div className="block mb-4">
            {/* Title */}
            <h3 className="text-xl font-bold text-neutral-800 mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300">
              {metadata.title}
            </h3>

            {/* Composer */}
            {metadata.composerName && (
              <p className="text-neutral-700 font-bold text-sm flex items-center gap-2">
                <span className="w-5 h-[2px] bg-primary/20 group-hover:bg-primary/50 transition-colors inline-block rounded-full"></span>
                {metadata.composerName}
              </p>
            )}
          </div>

          <div className="flex-grow"></div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between text-xs text-neutral-400 font-medium pt-4 border-t border-dashed border-neutral-100 group-hover:border-primary/10 transition-colors">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                {metadata.date}
              </span>
            </div>
            {/* Arrow Icon */}
            <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </m.div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
