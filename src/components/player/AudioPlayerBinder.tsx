'use client';

import { ReactNode, useMemo } from 'react';
import { PlayerProvider, PlayerSource as PlayableSource } from '@/domain/player/Player';
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
  playRequest?: Partial<PlayableSource>;
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
  const { play } = useAudioPlayer();

  // メタデータの解決ロジック
  const resolvedRequest = useMemo(() => {
    let extracted: Partial<PlayableSource> = {};

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
      metadata: {
        ...propRequest?.metadata,
        ...extracted.metadata,
      },
    };
  }, [source, format, propRequest]);

  const hasAudio = !!resolvedRequest.sourceId;

  const handlePlayClick = () => {
    if (!resolvedRequest.sourceId) return;

    // プラットフォームとデフォルト値の決定 logic
    const meta = resolvedRequest.metadata || {};
    const platform = (resolvedRequest.provider as PlayerProvider) || PlayerProvider.YOUTUBE;
    // NOTE: provider vs platform usage is a bit mixed, we stick to what we extract

    let platformUrl = meta.platformUrl;
    let platformLabel = meta.platformLabel;

    if (!platformUrl) {
      platformUrl = generateWatchUrl(platform, resolvedRequest.sourceId!) || undefined;
    }
    if (platform === PlayerProvider.YOUTUBE && !platformLabel) {
      platformLabel = 'Watch on YouTube';
    }

    play({
      sourceId: resolvedRequest.sourceId!,
      provider: platform, // or resolvedRequest.provider
      startSeconds: resolvedRequest.startSeconds || 0,
      endSeconds: resolvedRequest.endSeconds || 0,
      title: resolvedRequest.title || meta.title || 'Audio Recording',
      metadata: {
        // Keep legacy metadata population if needed
        composerName: meta.composerName,
        performer: meta.performer,
        thumbnail: meta.thumbnail,
        platformUrl,
        platformLabel,
        platform, // Keep for compatibility
      },
    });
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
            <span>▶ Play Audio</span>
          </button>
        </div>
      )}
    </div>
  );
}
