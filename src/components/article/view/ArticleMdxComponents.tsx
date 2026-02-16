import { MdxLink } from '@/components/mdx/MdxLink';
import PhraseRenderer from '@/components/score';
import { AudioPlayerBinder } from '@/components/player/AudioPlayerBinder';
import { MediaMetadataService } from '@/infrastructure/player/media.metadata.service';
import { PlayerFlatProperties } from '@/components/player/AudioPlayerContext';
import { ComponentProps, isValidElement, ReactElement } from 'react';
import Image from 'next/image';

import { ArticleMetadata } from '@/domain/article/article.metadata';

/**
 * createArticleMdxComponents
 * 記事詳細で使用するMDXコンポーネント定義を生成します。
 * 記事ごとの音源情報やパス情報を反映させるため、関数形式にしています。
 */
export const createArticleMdxComponents = (
  audioMetadata?: Partial<PlayerFlatProperties> & Record<string, unknown>,
  articleMetadata?: ArticleMetadata,
) => ({
  a: MdxLink,
  pre: (props: ComponentProps<'pre'>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let codeProps: { className?: string; children?: any } = {};
    if (isValidElement(props.children)) {
      codeProps = ((props.children as ReactElement).props as Record<string, unknown>) || {};
    }
    const className = ((codeProps as Record<string, unknown>)?.className as string) || '';

    if (className.includes('language-abc')) {
      let abcContent = codeProps.children;
      if (typeof abcContent !== 'string') {
        abcContent = Array.isArray(abcContent) ? abcContent.join('') : String(abcContent || '');
      }

      const abcMetadata = new MediaMetadataService().parse(abcContent, 'abc');
      const extracted = abcMetadata;

      const mergedRequest = {
        sourceId: (extracted?.sourceId || audioMetadata?.src || audioMetadata?.sourceId) as
          | string
          | undefined,
        provider: (extracted?.provider || audioMetadata?.provider || audioMetadata?.platform) as
          | 'youtube'
          | 'spotify'
          | 'soundcloud'
          | 'apple-music'
          | 'audio-file'
          | 'generic'
          | undefined,
        startSeconds: (extracted?.startSeconds ?? audioMetadata?.startSeconds) as
          | number
          | undefined,
        endSeconds: (extracted?.endSeconds ?? audioMetadata?.endSeconds) as number | undefined,
        title: (extracted?.title || audioMetadata?.title || undefined) as string | undefined,
        composerName: (extracted?.composerName || audioMetadata?.composerName || undefined) as
          | string
          | undefined,
        performer: (extracted?.performer || audioMetadata?.performer || undefined) as
          | string
          | undefined,
        image: (extracted?.image ||
          audioMetadata?.thumbnail ||
          audioMetadata?.image ||
          undefined) as string | undefined,
        sourceUrl: (extracted?.sourceUrl || audioMetadata?.platformUrl || undefined) as
          | string
          | undefined,
      };

      if (!mergedRequest.sourceId) {
        return (
          <div className="my-10 not-prose p-6 bg-neutral-100 rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <PhraseRenderer phrase={{ format: 'abc', data: abcContent }} />
          </div>
        );
      }

      return (
        <div className="my-10 not-prose p-6 bg-neutral-100 rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <AudioPlayerBinder source={abcContent} format="abc" playRequest={mergedRequest}>
            <PhraseRenderer phrase={{ format: 'abc', data: abcContent }} />
          </AudioPlayerBinder>
        </div>
      );
    }
    return <pre {...props} />;
  },
  PhraseRenderer: PhraseRenderer,
  Phrase: ({ src, description, id }: { src?: string; description?: string; id?: string }) => {
    // Determine path based on infrastructure design:
    // Articles: public/articles/{slug}/images/
    // Works: public/works/{composer}/{work}/phrases/

    let imagePath = '';

    if (articleMetadata?.slug) {
      const cleanSrc = src?.startsWith('./') ? src.slice(2) : src;
      const category = articleMetadata.category || 'works';

      if (cleanSrc) {
        if (cleanSrc.startsWith('images/')) {
          imagePath = `/articles/${category}/${articleMetadata.slug}/${cleanSrc}`;
        } else {
          // If it contains a slash, it might be a legacy path (e.g. beethoven/score.svg)
          // In the new structure, we colocate assets directly in the images/ folder.
          const filename = cleanSrc.split('/').pop() || cleanSrc;
          imagePath = `/articles/${category}/${articleMetadata.slug}/images/${filename}`;
        }
      } else if (id) {
        imagePath = `/articles/${category}/${articleMetadata.slug}/images/${id}.svg`;
      }
    }

    // Traditional/Legacy fallback
    if (!imagePath) {
      imagePath = src ? `/images/article/${src}` : id ? `/images/article/beethoven/${id}.svg` : '';
    }

    if (!imagePath) return null;

    return (
      <figure className="my-10 not-prose">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden p-4">
          <Image
            src={imagePath}
            alt={description || id || 'Phrase'}
            width={0}
            height={0}
            sizes="100vw"
            className="w-full h-auto"
            crossOrigin="anonymous"
          />
        </div>
        {description && (
          <figcaption className="mt-4 text-center text-sm font-medium text-tertiary">
            {description}
          </figcaption>
        )}
      </figure>
    );
  },
});
