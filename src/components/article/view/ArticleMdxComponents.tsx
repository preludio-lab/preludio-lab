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
                src: extracted?.src || audioMetadata?.src,
                metadata: {
                    title: extracted?.metadata?.title || audioMetadata?.title,
                    composerName: extracted?.metadata?.composerName || audioMetadata?.composerName,
                    performer: extracted?.metadata?.performer || audioMetadata?.performer,
                    thumbnail: extracted?.metadata?.thumbnail || audioMetadata?.thumbnail,
                    platform: (extracted?.metadata?.platform || audioMetadata?.platform) as any,
                },
                options: {
                    startSeconds: typeof extracted?.options?.startSeconds === 'number'
                        ? extracted.options.startSeconds
                        : undefined,
                    endSeconds: typeof extracted?.options?.endSeconds === 'number'
                        ? extracted.options.endSeconds
                        : undefined,
                }
            };

            if (!mergedPlayRequest.src) {
                return (
                    <div className="my-10 not-prose p-6 bg-neutral-100 rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                        <ScoreRenderer score={{ format: 'abc', data: abcContent }} />
                    </div>
                );
            }

            return (
                <div className="my-10 not-prose p-6 bg-neutral-100 rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <AudioPlayerBinder
                        source={abcContent}
                        format="abc"
                        playRequest={mergedPlayRequest}
                    >
                        <ScoreRenderer score={{ format: 'abc', data: abcContent }} />
                    </AudioPlayerBinder>
                </div>
            );
        }
        return <pre {...props} />;
    },
    ScoreRenderer: ScoreRenderer,
});
