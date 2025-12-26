'use client';

import { ReactNode, useMemo } from 'react';
import { PlayerPlatform, PlayerPlatformType } from '@/domain/player/PlayerConstants';
import { PlayRequest } from '@/domain/player/Player';
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
    playRequest?: Partial<PlayRequest>;
    /**
     * ラップする子要素
     */
    children: ReactNode;
}

/**
 * AudioPlayerBinder
 * 任意の子要素に再生機能を付与するためのバインダーコンポーネント。
 */
export function AudioPlayerBinder({ source, format, playRequest: propRequest, children }: AudioPlayerBinderProps) {
    const { play } = useAudioPlayer();

    // メタデータの解決ロジック
    const resolvedRequest = useMemo(() => {
        let extracted: Partial<PlayRequest> = {};

        // ソースがある場合は解析
        if (source && format) {
            extracted = new MediaMetadataService().parse(source, format);
        }

        // プロパティとマージ (抽出されたメタデータを優先)
        // ページレベルのメタデータ(propRequest)は「デフォルト値」として扱い、
        // コンテンツ固有のメタデータ(extracted)がある場合はそれを優先します。

        // ソースが明示的に指定されている場合、時間は継承しません (新しいコンテキストとみなす)
        const isExplicitSource = !!extracted.src;
        const extractedOptions = extracted.options || {};
        const propOptions = propRequest?.options || {};

        return {
            src: extracted.src || propRequest?.src,
            metadata: {
                ...propRequest?.metadata,
                ...extracted.metadata
            },
            options: isExplicitSource
                ? extractedOptions
                : (extractedOptions.startSeconds !== undefined || extractedOptions.endSeconds !== undefined)
                    ? extractedOptions
                    : propOptions
        };
    }, [source, format, propRequest]);

    const hasAudio = !!resolvedRequest.src;

    const handlePlayClick = () => {
        if (!resolvedRequest.src) return;

        const meta = resolvedRequest.metadata || {};
        const options = resolvedRequest.options || {};

        // プラットフォームとデフォルト値の決定 logic
        const platform = (meta.platform as PlayerPlatformType) || PlayerPlatform.YOUTUBE;
        let platformUrl = meta.platformUrl;
        let platformLabel = meta.platformLabel;

        if (!platformUrl) {
            platformUrl = generateWatchUrl(platform, resolvedRequest.src) || undefined;
        }
        if (platform === PlayerPlatform.YOUTUBE && !platformLabel) {
            platformLabel = 'Watch on YouTube';
        }

        play(
            resolvedRequest.src,
            {
                title: meta.title || 'Audio Recording',
                composer: meta.composer,
                performer: meta.performer,
                artworkSrc: meta.artworkSrc,
                platformUrl,
                platformLabel,
                platform,
            },
            {
                startSeconds: options.startSeconds,
                endSeconds: options.endSeconds
            }
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
                        <span>▶ Play Audio</span>
                    </button>
                </div>
            )}
        </div>
    );
}
