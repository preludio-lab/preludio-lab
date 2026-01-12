import { MdxLink } from '@/components/mdx/MdxLink';
import ScoreRenderer from '@/components/score';
import { AudioPlayerBinder } from '@/components/player/AudioPlayerBinder';
import { MediaMetadataService } from '@/infrastructure/player/MediaMetadataService';

/**
 * createArticleMdxComponents
 * 記事詳細で使用するMDXコンポーネント定義を生成します。
 * 記事ごとの音源情報をフォールバックとして利用するため、関数形式にしています。
 */
export const createArticleMdxComponents = (audioMetadata?: any) => ({
  a: MdxLink,
  pre: (props: any) => {
    const codeProps = props.children?.props;
    const className = codeProps?.className || '';

    if (className.includes('language-abc')) {
      let abcContent = codeProps.children;
      if (typeof abcContent !== 'string') {
        abcContent = Array.isArray(abcContent) ? abcContent.join('') : String(abcContent || '');
      }

      const abcMetadata = new MediaMetadataService().parse(abcContent, 'abc');
      const extracted = abcMetadata;

      const mergedPlayRequest = {
        sourceId: extracted?.sourceId || audioMetadata?.src || audioMetadata?.sourceId, // Backwards compat for 'src'
        provider: extracted?.provider || audioMetadata?.provider,
        startSeconds:
          typeof extracted?.startSeconds === 'number'
            ? extracted.startSeconds
            : typeof audioMetadata?.startSeconds === 'number'
              ? audioMetadata.startSeconds
              : 0,
        endSeconds:
          typeof extracted?.endSeconds === 'number'
            ? extracted.endSeconds
            : typeof audioMetadata?.endSeconds === 'number'
              ? audioMetadata.endSeconds
              : 0,
        title: extracted?.title || audioMetadata?.title,
        metadata: {
          title: extracted?.title || audioMetadata?.title,
          composerName: extracted?.metadata?.composerName || audioMetadata?.composerName,
          performer: extracted?.metadata?.performer || audioMetadata?.performer,
          thumbnail: extracted?.metadata?.thumbnail || audioMetadata?.thumbnail,
          platform: (extracted?.metadata?.platform || audioMetadata?.platform) as any,
          platformUrl: extracted?.metadata?.platformUrl || audioMetadata?.platformUrl,
          platformLabel: extracted?.metadata?.platformLabel || audioMetadata?.platformLabel,
        },
      };

      if (!mergedPlayRequest.sourceId) {
        return (
          <div className="my-10 not-prose p-6 bg-neutral-100 rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <ScoreRenderer score={{ format: 'abc', data: abcContent }} />
          </div>
        );
      }

      return (
        <div className="my-10 not-prose p-6 bg-neutral-100 rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <AudioPlayerBinder source={abcContent} format="abc" playRequest={mergedPlayRequest}>
            <ScoreRenderer score={{ format: 'abc', data: abcContent }} />
          </AudioPlayerBinder>
        </div>
      );
    }
    return <pre {...props} />;
  },
  ScoreRenderer: ScoreRenderer,
});
