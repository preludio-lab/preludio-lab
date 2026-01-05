import { ContentDetail, ContentSummary } from '@/domain/content/Content';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getTranslations } from 'next-intl/server';
import { FadeInHeading } from '@/components/ui/FadeInHeading';
import { TableOfContents } from './TableOfContents';
import { SeriesNavigation } from './SeriesNavigation';
import { WorkPlayerPlaceholder } from './work/WorkPlayerPlaceholder';
import { ListeningGuide } from './work/ListeningGuide';
import { AudioPlayerBinder } from '@/components/player/AudioPlayerBinder';
import ScoreRenderer from '@/components/score';
import { MdxLink } from '@/components/mdx/MdxLink';
import rehypeSlug from 'rehype-slug';
import { MediaMetadataService } from '@/infrastructure/player/MediaMetadataService';

interface ContentDetailFeatureProps {
  content: ContentDetail;
  toc: { level: number; text: string; slug: string }[];
  prevContent: ContentSummary | null;
  nextContent: ContentSummary | null;
}

/**
 * コンテンツ詳細ページの機能コンポーネント。
 * メタデータヒーローとMDX本文を、統一された2カラムレイアウトとサイドバーでレンダリングします。
 */
export async function ContentDetailFeature({
  content,
  toc,
  prevContent,
  nextContent,
}: ContentDetailFeatureProps) {
  const t = await getTranslations('CategoryIndex');
  const { metadata, category, lang } = content;

  const hasAudio = !!metadata.audioSrc;

  // AudioPlayerBinder用のAudioMetadataを構築
  const audioMetadata = hasAudio
    ? {
      src: metadata.audioSrc!,
      title: metadata.title,
      composerName: metadata.composerName,
      performer: metadata.performer,
      thumbnail: metadata.thumbnail,
      startSeconds: metadata.startSeconds,
      endSeconds: metadata.endSeconds,
      platform: 'youtube',
    }
    : undefined;

  const mdxComponents = {
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
            // extracted.options (譜例) があればそれを優先、なければ undefined (ベースは継承しない)
            // ただし、audioMetadata (記事) があっても、譜例に時間指定がなければ「最初から」再生したい場合が多い。
            // 仕様: "%%audio_startSeconds が指定されている場合は...上書き"
            startSeconds: typeof extracted?.options?.startSeconds === 'number'
              ? extracted.options.startSeconds
              : undefined,
            endSeconds: typeof extracted?.options?.endSeconds === 'number'
              ? extracted.options.endSeconds
              : undefined,
          }
        };

        // playRequest自体を構成できない（srcがない）場合はBinderを使わない
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
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 max-w-6xl pt-28">
      {/* パンくずリスト */}
      <nav className="text-sm rounded-md mb-8 flex items-center gap-2 text-tertiary">
        <a href={`/${lang}`} className="hover:text-primary transition-colors">
          Home
        </a>
        <span>/</span>
        <a
          href={`/${lang}/${category}`}
          className="hover:text-primary transition-colors capitalize"
        >
          {category}
        </a>
        <span>/</span>
        <span className="text-primary font-medium truncate">{metadata.title}</span>
      </nav>

      {/* ヘッダー */}
      <header className="mb-12 border-b border-divider pb-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {t(`categories.${category}`)}
            </span>
            {metadata.difficulty && (
              <span className="bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {t(`difficulty.${metadata.difficulty}`)}
              </span>
            )}
          </div>

          <FadeInHeading className="text-4xl md:text-6xl font-black text-primary mb-2 leading-tight font-serif">
            {metadata.title}
          </FadeInHeading>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-lg text-secondary italic">
            {metadata.composerName && (
              <div>
                <span className="font-bold text-primary not-italic">Composer:</span>{' '}
                <span>{metadata.composerName}</span>
              </div>
            )}
            {metadata.date && (
              <time className="text-tertiary not-italic ml-auto lg:ml-0">{metadata.date}</time>
            )}
          </div>
        </div>
      </header>

      {/* メインコンテンツエリア (統一された2カラムレイアウト) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        <article
          className="lg:col-span-7 whitespace-normal prose prose-lg prose-slate max-w-none 
                    prose-headings:text-primary prose-headings:font-black 
                    prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-primary prose-img:rounded-3xl prose-img:shadow-xl
                "
        >
          {/* モバイル用サイドバー (lg未満で表示) */}
          <div className="lg:hidden mb-12 space-y-8">
            {hasAudio && (
              <>
                <WorkPlayerPlaceholder />
                <ListeningGuide />
              </>
            )}
            <details className="group bg-neutral-50 rounded-xl overflow-hidden border border-divider">
              <summary className="flex items-center justify-between p-4 font-medium text-primary cursor-pointer list-none hover:bg-neutral-100">
                <span>Table of Contents</span>
                <span className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="p-4 pt-0 border-t border-divider">
                <TableOfContents items={toc} variant="minimal" />
              </div>
            </details>
          </div>

          <MDXRemote
            source={content.body}
            components={mdxComponents}
            options={{
              mdxOptions: {
                rehypePlugins: [rehypeSlug],
              },
            }}
          />

          <SeriesNavigation prev={prevContent} next={nextContent} lang={lang} />
        </article>

        {/* デスクトップ用サイドバー (lg以上で常に表示) */}
        <aside className="hidden lg:block lg:col-span-4 lg:col-start-9">
          <div className="sticky top-28 space-y-8">
            {hasAudio && (
              <div>
                <WorkPlayerPlaceholder />
                <ListeningGuide />
              </div>
            )}
            <div>
              <TableOfContents items={toc} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
