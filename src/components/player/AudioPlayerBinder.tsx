'use client';

import { ReactNode, useMemo } from 'react';
import { PlayerProvider, PlayerSource, PlayerDisplay } from '@/domain/player/Player';
import { useTranslations } from 'next-intl';
import { useAudioPlayer } from '@/components/player/AudioPlayerContext';
import { MediaMetadataService } from '@/infrastructure/player/MediaMetadataService';
import { generateWatchUrl } from '@/components/player/PlayerLinkHelper';

export interface AudioPlayerBinderProps {
  /**
   * 解析対象のソースコンテンツ（テキスト）
   * 指定された場合、formatに従って解析され、メタデータが抽出されます。
   */
  source?: string;
  /**
   * ソースのフォーマット (例: 'abc')
   */
  format?: string;
  /**
   * 直接指定する再生リクエスト (部分指定可)
   * sourceから抽出された情報とマージされ、こちらが優先されます。
   */
  playRequest?: Partial<PlayerSource & PlayerDisplay>;
  /**
   * ラップする子要素
   */
  children: ReactNode;
}

/**
 * AudioPlayerBinder
 * 任意の子要素に再生機能を付与するためのバインダーコンポーネント。
 */
export function AudioPlayerBinder({
  source,
  format,
  playRequest: propRequest,
  children,
}: AudioPlayerBinderProps) {
  const t = useTranslations('Player');
  const { play } = useAudioPlayer();

  // メタデータの解決ロジック
  const resolvedRequest = useMemo(() => {
    let extracted: Record<string, any> = {};

    // ソースがある場合は解析
    if (source && format) {
      extracted = new MediaMetadataService().parse(source, format);
    }

    // プロパティとマージ (抽出されたメタデータを優先)
    // ページレベルのメタデータ(propRequest)は「デフォルト値」として扱い、
    // コンテンツ固有のメタデータ(extracted)がある場合はそれを優先します。

    // ソースが明示的に指定されている場合、時間は継承しません (新しいコンテキストとみなす)

    const isExplicitSource = !!extracted.sourceId;

    // extracted has flat properties now
    const extractedStart = extracted.startSeconds;
    const extractedEnd = extracted.endSeconds;
    const propStart = propRequest?.startSeconds;
    const propEnd = propRequest?.endSeconds;

    return {
      sourceId: extracted.sourceId || propRequest?.sourceId,
      provider: extracted.provider || propRequest?.provider || PlayerProvider.GENERIC,
      startSeconds: isExplicitSource
        ? extractedStart
        : extractedStart !== undefined || extractedEnd !== undefined
          ? extractedStart
          : propStart,
      endSeconds: isExplicitSource
        ? extractedEnd
        : extractedStart !== undefined || extractedEnd !== undefined
          ? extractedEnd
          : propEnd,
      title: extracted.title || propRequest?.title,
      composerName: extracted.composerName || propRequest?.composerName,
      performer: extracted.performer || propRequest?.performer,
      image: extracted.image || propRequest?.image,
      sourceUrl: extracted.sourceUrl || propRequest?.sourceUrl,
    };
  }, [source, format, propRequest]);

  const hasAudio = !!resolvedRequest.sourceId;

  const handlePlayClick = () => {
    if (!resolvedRequest.sourceId) return;

    const platform = (resolvedRequest.provider as PlayerProvider) || PlayerProvider.GENERIC;
    let platformUrl = resolvedRequest.sourceUrl;

    if (!platformUrl && resolvedRequest.sourceId) {
      platformUrl = generateWatchUrl(platform, resolvedRequest.sourceId) || undefined;
    }

    play(
      {
        sourceId: resolvedRequest.sourceId!,
        provider: platform,
        startSeconds: resolvedRequest.startSeconds,
        endSeconds: resolvedRequest.endSeconds,
      },
      {
        title: resolvedRequest.title || 'Audio Recording',
        composerName: resolvedRequest.composerName,
        performer: resolvedRequest.performer,
        image: resolvedRequest.image,
        sourceUrl: platformUrl,
      },
    );
  };

  return (
    <div className="relative group audio-binder-wrapper">
      {children}

      {hasAudio && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 m-1">
          <button
            onClick={handlePlayClick}
            className="flex items-center gap-1.5 rounded-full bg-gray-900/90 text-white px-3 py-1.5 shadow-sm hover:bg-black hover:scale-105 transition-all text-xs font-medium backdrop-blur-sm"
          >

            <span>▶ {t(`provider.${resolvedRequest.provider || 'generic'}`)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
