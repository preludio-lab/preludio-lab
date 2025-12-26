'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PlayerPlatform, PlayerPlatformType } from '@/domain/player/PlayerConstants';
import { PlayRequestSchema } from '@/domain/player/Player';
import { handleClientError } from '@/lib/client-error';

export type PlayerMode = 'hidden' | 'mini' | 'focus';

// Define a type for the player instance proxy
// This should match the methods available on the actual player object (e.g., YouTube Player API)
export interface PlayerInstanceProxy {
    seekTo: (time: number, allowSeekAhead: boolean) => void;
    setVolume: (volume: number) => void;
    // Add other methods as needed, e.g., playVideo, pauseVideo, etc.
}

export interface PlayerState {
    /** 再生中かどうか */
    isPlaying: boolean;
    /** 現在の再生時間 (秒) */
    currentTime: number;
    /** メディアの総再生時間 (秒) */
    duration: number;
    /**
     * メディアソースの識別子 (旧 videoId)
     * YouTubeの場合はVideo ID、その他はURLなど
     */
    src: string | null;
    /** プレイヤーの表示モード (hidden: 非表示, mini: ミニプレイヤー, focus: フォーカスモード) */
    mode: PlayerMode;
    /** 楽曲タイトル */
    title: string | null;
    /** 作曲者名 (例: "J.S. Bach") */
    composer: string | null;
    /** 演奏者名 (例: "Glenn Gould") */
    performer: string | null;
    /** アートワーク画像のURL */
    artworkSrc: string | null;
    /** プラットフォームの元リンクURL (例: YouTubeの動画ページURL) */
    platformUrl: string | null;
    /** プラットフォームの表示ラベル (例: "Watch on YouTube") */
    platformLabel: string | null;
    /** プラットフォーム種別 (将来的な拡張用) */
    platform: PlayerPlatformType | null;
    /** プレイヤーの準備が完了したか */
    isReady: boolean;
    /** 音量 (0-100) */
    volume: number;
    /** 再生開始位置 (秒) - 指定された場合、この時間より前にはシークできない等の制限に使われる */
    startSeconds?: number;
    /** 再生終了位置 (秒) - 指定された場合、この時間で停止する */
    endSeconds?: number;
    /** 再生リクエストの度にインクリメントされるID (useEffectのトリガー用) */
    playbackId: number;
}

export interface PlayerActions {
    /**
     * 再生を開始する
     * @param src メディアソースID (YouTube ID等)
     * @param metadata 楽曲メタデータ (タイトル、作曲者等)
     * @param options 再生オプション (開始・終了時間等)
     */
    play: (
        src?: string,
        metadata?: {
            title?: string;
            composer?: string;
            performer?: string;
            artworkSrc?: string;
            platformUrl?: string;
            platformLabel?: string;
            platform?: 'youtube' | 'default';
        },
        options?: { startSeconds?: number; endSeconds?: number }
    ) => void;
    /** 一時停止する */
    pause: () => void;
    /** 再生/一時停止を切り替える */
    togglePlay: () => void;
    /**
     * 指定した時間にシークする
     * @param time 秒単位の時間
     */
    seekTo: (time: number) => void;
    /**
     * 音量を設定する
     * @param volume 0-100の数値
     */
    setVolume: (volume: number) => void;
    /** 表示モードを設定する */
    setMode: (mode: PlayerMode) => void;
    /**
     * 内部プレイヤーインスタンスを設定する (GlobalAudioPlayer等のSmart Componentから呼ばれる)
     * @param instance プレイヤー操作用プロキシオブジェクト
     */
    setPlayerInstance: (instance: PlayerInstanceProxy | null) => void;

    // Internal callbacks (used by player component)
    /** 内部用: プレイヤー準備完了コールバック */
    _onReady: (duration: number) => void;
    /** 内部用: 再生状態変更コールバック */
    _onStateChange: (isPlaying: boolean) => void;
    /** 内部用: 再生進捗コールバック */
    _onProgress: (currentTime: number) => void;
    /** 内部用: 再生時間更新コールバック */
    _onDuration: (duration: number) => void;
}

export const AudioPlayerContext = createContext<(PlayerState & PlayerActions) | null>(null);

export function useAudioPlayer() {
    const context = useContext(AudioPlayerContext);
    if (!context) {
        throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
    }
    return context;
}

const STORAGE_KEY = 'preludio_player_state';

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
    const t = useTranslations('Player');
    const [state, setState] = useState<PlayerState>({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        src: null,
        mode: 'hidden',
        title: null,
        composer: null,
        performer: null,
        artworkSrc: null,
        platformUrl: null,
        platformLabel: null,
        platform: null,
        isReady: false,
        volume: 100,
        startSeconds: undefined,
        endSeconds: undefined,
        playbackId: 0,
    });

    // Load state from localStorage on mount (Client-side only)
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate parsed data structure partially if needed, or just merge
                // Force isPlaying to false to prevent auto-start policy issues on reload, 
                // unless we implement specific "resume" logic interaction. 
                // For now, let's keep isPlaying false but restore everything else (metadata, progress).
                setState(prev => ({
                    ...prev,
                    ...parsed,
                    isPlaying: false, // Resume paused
                    isReady: false,   // Player needs to re-initialize
                    playbackId: prev.playbackId + 1 // Force update hooks
                }));
            }
        } catch (e) {
            console.error('Failed to load player state', e);
        }
    }, []);

    // Save state to localStorage on change
    useEffect(() => {
        // Only save minimal data needed for restoration
        // Avoid saving 'isReady', 'isPlaying' (handled separately), etc.
        if (state.mode === 'hidden' && !state.src) {
            // If player is effectively cleared, clear storage
            localStorage.removeItem(STORAGE_KEY);
            return;
        }

        const stateToSave = {
            currentTime: state.currentTime,
            duration: state.duration,
            src: state.src,
            mode: state.mode,
            title: state.title,
            composer: state.composer,
            performer: state.performer,
            artworkSrc: state.artworkSrc,
            platformUrl: state.platformUrl,
            platformLabel: state.platformLabel,
            platform: state.platform,
            volume: state.volume,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [
        state.currentTime, state.duration, state.src, state.mode,
        state.title, state.composer, state.performer, state.artworkSrc,
        state.platformUrl, state.platformLabel, state.platform, state.volume
    ]);

    // NOTE: YouTube Playerインスタンスと通信する仕組みが必要です。
    // よりクリーンなアーキテクチャでは、プレイヤーが公開するRefを使用する手もありますが、
    // Playerコンポーネントは（Contextの）兄弟要素になる可能性が高いため、Event Busを使うか、
    // あるいはプレイヤーが監視する「リクエスト」をステートとして公開する必要があります。
    // 現時点でのシンプルなアプローチ: Contextが「正（Source of Truth）」を持ち、Playerコンポーネントがそれを監視します。
    // ただし、`seekTo` は命令的な操作です。
    // 再レンダリングや「シークリクエスト」等の複雑なステートフラグを避けるため、
    // 命令的なコマンドには Mutable Ref を使用することにします。

    // 実際、YouTubeのReactラッパー等は、Play/Pause/VideoId についてはPropsの変更検知で十分です。
    // しかし、SeekTo は通常、インスタンスメソッドの呼び出しが必要です。
    // ステートに "seekRequest" を追加する案もありますが、
    // ここではプレイヤー側から登録するためのコールバックを公開する方がスマートでしょう。
    const playerRef = useRef<PlayerInstanceProxy | null>(null); // Holds the YouTube Player object

    const setPlayerInstance = useCallback((instance: PlayerInstanceProxy | null) => {
        playerRef.current = instance;
    }, []);

    // --- Internal Callbacks from Player Component ---

    const _onReady = useCallback((duration: number) => {
        setState((prev) => ({ ...prev, isReady: true, duration }));
    }, []);

    const _onProgress = useCallback((currentTime: number) => {
        setState((prev) => ({ ...prev, currentTime }));
    }, []);

    const _onStateChange = useCallback((isPlaying: boolean) => {
        // Only update if different to avoid loops, though likely fine
        setState((prev) => {
            if (prev.isPlaying === isPlaying) return prev;
            return { ...prev, isPlaying };
        });
    }, []);

    const _onDuration = useCallback((duration: number) => {
        setState((prev) => ({ ...prev, duration }));
    }, []);

    const play = useCallback((
        src?: string,
        metadata?: {
            title?: string;
            composer?: string;
            performer?: string;
            artworkSrc?: string;
            platformUrl?: string;
            platformLabel?: string;
            platform?: 'youtube' | 'default';
        },
        options?: { startSeconds?: number; endSeconds?: number }
    ) => {
        // [DOMAIN VALIDATION]
        const validationResult = PlayRequestSchema.safeParse({ src, metadata, options });
        if (!validationResult.success) {
            console.error('[AudioPlayerContext] Validation Error:', validationResult.error);
            // 本番ではユーザーに通知するか、エラーハンドリングポリシーに従う
            // ここではコンソールエラーのみとし、処理は継続させない（安全策）
            handleClientError(new Error(`Invalid play request: ${validationResult.error.message}`), t('invalidRequest'));
            return;
        }

        setState((prev) => {
            const newState = { ...prev, isPlaying: true, playbackId: prev.playbackId + 1 };
            if (src && src !== prev.src) {
                newState.src = src;
                newState.currentTime = 0; // Reset time on new source
                if (prev.mode === 'hidden') {
                    newState.mode = 'mini';
                }
                // Reset metadata if new source
                newState.title = null;
                newState.composer = null;
                newState.performer = null;
                newState.artworkSrc = null;
                newState.platformUrl = null;
                newState.platformLabel = null;
                newState.platform = null;
            }
            if (metadata) {
                if (metadata.title) newState.title = metadata.title;
                if (metadata.composer) newState.composer = metadata.composer;
                if (metadata.performer) newState.performer = metadata.performer;
                if (metadata.artworkSrc) newState.artworkSrc = metadata.artworkSrc;
                if (metadata.platformUrl) newState.platformUrl = metadata.platformUrl;
                if (metadata.platformLabel) newState.platformLabel = metadata.platformLabel;
                if (metadata.platform) newState.platform = metadata.platform;
            }
            if (options) {
                newState.startSeconds = options.startSeconds;
                newState.endSeconds = options.endSeconds;
            } else {
                // If checking a new source without options, reset bounds? 
                if (src && src !== prev.src) {
                    newState.startSeconds = undefined;
                    newState.endSeconds = undefined;
                }
            }
            return newState;
        });
    }, []);

    const pause = useCallback(() => {
        setState((prev) => ({ ...prev, isPlaying: false }));
    }, []);

    const togglePlay = useCallback(() => {
        setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    }, []);

    const seekTo = useCallback((time: number) => {
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
            playerRef.current.seekTo(time, true);
            setState(prev => ({ ...prev, currentTime: time }));
        }
    }, []);

    const setVolume = useCallback((volume: number) => {
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(volume);
            setState(prev => ({ ...prev, volume }));
        }
    }, []);

    const setMode = useCallback((mode: PlayerMode) => {
        setState((prev) => ({ ...prev, mode }));
    }, []);



    const value = useMemo(() => ({
        ...state,
        play,
        pause,
        togglePlay,
        seekTo,
        setVolume,
        setMode,
        _onReady,
        _onProgress,
        _onDuration,
        _onStateChange,
        setPlayerInstance, // Internal helper to register player
    }), [state, play, pause, togglePlay, seekTo, setVolume, setMode, _onReady, _onProgress, _onDuration, _onStateChange, setPlayerInstance]);

    return (
        <AudioPlayerContext.Provider value={value}>
            {children}
        </AudioPlayerContext.Provider>
    );
}

// Extend the interface to include the internal setter
declare module './AudioPlayerContext' {
    interface PlayerActions {
        setPlayerInstance: (instance: PlayerInstanceProxy | null) => void;
    }
}
