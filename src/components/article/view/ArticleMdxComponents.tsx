import { MdxLink } from '@/components/mdx/MdxLink';
import ScoreRenderer from '@/components/score';
import { AudioPlayerBinder } from '@/components/player/AudioPlayerBinder';
import { MediaMetadataService } from '@/infrastructure/player/media.metadata.service';
import { PlayerFlatProperties } from '@/components/player/AudioPlayerContext';
import { ComponentProps, isValidElement, ReactElement, ReactNode } from 'react';

/**
 * createArticleMdxComponents
 * 記事詳細で使用するMDXコンポーネント定義を生成します。
 * 記事ごとの音源情報をフォールバックとして利用するため、関数形式にしています。
 */
export const createArticleMdxComponents = (
  audioMetadata?: Partial<PlayerFlatProperties> & Record<string, unknown>,
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
            <ScoreRenderer score={{ format: 'abc', data: abcContent }} />
          </div>
        );
      }

      return (
        <div className="my-10 not-prose p-6 bg-neutral-100 rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <AudioPlayerBinder source={abcContent} format="abc" playRequest={mergedRequest}>
            <ScoreRenderer score={{ format: 'abc', data: abcContent }} />
          </AudioPlayerBinder>
        </div>
      );
    }
    return <pre {...props} />;
  },
  ScoreRenderer: ScoreRenderer,
});
