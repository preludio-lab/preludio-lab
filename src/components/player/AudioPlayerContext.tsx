'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { useTranslations } from 'next-intl';
import { generateId } from '@/shared/id';
import {
  PlayerMode,
  PlayerSource,
  PlayerSourceSchema,
  PlayerDisplay,
  PlayerDisplaySchema,
  PlayerStatus,
  PlayerControl,
  PlayerProvider,
  DisplayType,
} from '@/domain/player/player';
import { handleClientError } from '@/lib/client-error';

export type PlayerModeType = PlayerMode;

// Define a type for the player instance proxy
// This should match the methods available on the actual player object (e.g., YouTube Player API)
export interface PlayerInstanceProxy {
  seekTo: (time: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  // Add other methods as needed, e.g., playVideo, pauseVideo, etc.
}

export interface PlayerState {
  /** ドメインモデル: 表示情報 */
  display: PlayerDisplay;
  /** ドメインモデル: 技術ソース情報 */
  source: PlayerSource;
  /** ドメインモデル: 再生状態情報 */
  status: PlayerStatus;
  /** ドメインモデル: 制御情報 */
  control: PlayerControl;

  /** プレイヤーの準備が完了したか (UI固有の状態) */
  isReady: boolean;
  /** 再生リクエストの度にインクリメントされるID (useEffectのトリガー用) */
  playbackId: number;
}

export interface PlayerActions {
  /**
   * 再生を開始する
   * @param source プレイヤーソース (技術情報)
   * @param display 表示情報 (Optional)
   */
  play: (source: PlayerSource, display?: Partial<PlayerDisplay>) => void;
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
  setMode: (mode: PlayerModeType) => void;
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

/**
 * UI互換性のためのフラットなプロパティ定義
 */
export interface PlayerFlatProperties {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  src: string | null;
  mode: PlayerModeType;
  title: string | null;
  performer: string | null;
  thumbnail: string | null;
  platformUrl: string | null;

  platform: PlayerProvider | null;
  volume: number;
  isReady: boolean;
  playbackId: number;
  startSeconds?: number;
  endSeconds?: number;
  // レガシー対応
  composerName: string | null;
}

export const AudioPlayerContext = createContext<(PlayerFlatProperties & PlayerActions) | null>(
  null,
);

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
    control: { id: generateId<'Player'>(), createdAt: new Date(), updatedAt: new Date() },
    display: {
      title: '',
      composerName: '',
      performer: '',
      image: '',
      sourceUrl: undefined,
      provider: PlayerProvider.GENERIC,
      displayType: DisplayType.AUDIO,
    },
    source: {
      sourceId: '',
      provider: PlayerProvider.YOUTUBE,
      startSeconds: undefined,
      endSeconds: undefined,
    },
    status: { isPlaying: false, currentTime: 0, duration: 0, volume: 100, mode: PlayerMode.HIDDEN },
    isReady: false,
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState((prev) => ({
          ...prev,
          ...parsed,
          isPlaying: false, // Resume paused
          isReady: false, // Player needs to re-initialize
          playbackId: prev.playbackId + 1, // Force update hooks
        }));
      }
    } catch (e) {
      console.error('Failed to load player state', e);
    }
  }, []);

  // Save logic (Simplified for structured state)
  useEffect(() => {
    if (state.status.mode === PlayerMode.HIDDEN && !state.source.sourceId) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const stateToSave = {
      currentTime: state.status.currentTime,
      duration: state.status.duration,
      source: state.source,
      display: state.display,
      mode: state.status.mode,
      volume: state.status.volume,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [state.status, state.source, state.display]);

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
    setState((prev) => ({
      ...prev,
      isReady: true,
      status: { ...prev.status, duration },
    }));
  }, []);

  const _onProgress = useCallback((currentTime: number) => {
    setState((prev) => ({
      ...prev,
      status: { ...prev.status, currentTime },
    }));
  }, []);

  const _onStateChange = useCallback((isPlaying: boolean) => {
    setState((prev) => {
      if (prev.status.isPlaying === isPlaying) return prev;
      return {
        ...prev,
        status: { ...prev.status, isPlaying },
      };
    });
  }, []);

  const _onDuration = useCallback((duration: number) => {
    setState((prev) => ({
      ...prev,
      status: { ...prev.status, duration },
    }));
  }, []);

  const play = useCallback(
    (source: PlayerSource, customDisplay?: Partial<PlayerDisplay>) => {
      const sourceValidation = PlayerSourceSchema.safeParse(source);
      if (!sourceValidation.success) {
        console.error('[AudioPlayerContext] Source Validation Error:', sourceValidation.error);
        handleClientError(
          new Error(`Invalid play request (source): ${sourceValidation.error.message}`),
          t('invalidRequest'),
        );
        return;
      }

      const validSource = sourceValidation.data;

      // Extract title from source if not provided in display
      const sourceTitle = (source as unknown as Partial<PlayerDisplay>).title; // Backwards compatibility with extracted metadata if any

      setState((prev) => {
        const isNewSource = validSource.sourceId !== prev.source.sourceId;

        let newMode = prev.status.mode;
        if (prev.status.mode === PlayerMode.HIDDEN) {
          newMode = PlayerMode.MINI;
        }

        // Display Mapping
        const newDisplay: PlayerDisplay = {
          title: customDisplay?.title || sourceTitle || prev.display.title || 'Audio Recording',
          composerName:
            customDisplay?.composerName ||
            (source as unknown as Partial<PlayerDisplay>).composerName ||
            prev.display.composerName,
          performer:
            customDisplay?.performer ||
            (source as unknown as Partial<PlayerDisplay>).performer ||
            prev.display.performer,
          image:
            customDisplay?.image ||
            (source as unknown as Partial<PlayerDisplay>).image ||
            prev.display.image,
          sourceUrl:
            customDisplay?.sourceUrl ||
            (source as unknown as Partial<PlayerDisplay>).sourceUrl ||
            prev.display.sourceUrl,
          provider: validSource.provider,
          displayType:
            customDisplay?.displayType ||
            (source as unknown as Partial<PlayerDisplay>).displayType ||
            prev.display.displayType ||
            DisplayType.AUDIO,
        };

        const displayValidation = PlayerDisplaySchema.safeParse(newDisplay);
        if (!displayValidation.success) {
          console.error('[AudioPlayerContext] Display Validation Error:', displayValidation.error);
          // Fallback to previous display if invalid, or just keep it
        }

        const finalDisplay = displayValidation.success ? displayValidation.data : newDisplay;

        const newStatus: PlayerStatus = {
          ...prev.status,
          isPlaying: true,
          currentTime: isNewSource ? (validSource.startSeconds ?? 0) : prev.status.currentTime,
          mode: newMode,
        };

        return {
          ...prev,
          source: validSource,
          display: finalDisplay,
          status: newStatus,
          playbackId: prev.playbackId + 1,
        };
      });
    },
    [t],
  );

  const pause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: { ...prev.status, isPlaying: false },
    }));
  }, []);

  const togglePlay = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: { ...prev.status, isPlaying: !prev.status.isPlaying },
    }));
  }, []);

  const seekTo = useCallback((time: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(time, true);
      setState((prev) => ({
        ...prev,
        status: { ...prev.status, currentTime: time },
      }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(volume);
      setState((prev) => ({
        ...prev,
        status: { ...prev.status, volume },
      }));
    }
  }, []);

  const setMode = useCallback((mode: PlayerModeType) => {
    setState((prev) => ({
      ...prev,
      status: { ...prev.status, mode },
    }));
  }, []);

  const flatProperties: PlayerFlatProperties = useMemo(
    () => ({
      isPlaying: state.status.isPlaying,
      currentTime: state.status.currentTime,
      duration: state.status.duration,
      src: state.source.sourceId || null,
      mode: state.status.mode,
      title: state.display.title || null,
      performer: state.display.performer || null,
      thumbnail: state.display.image || null,
      platformUrl: state.display.sourceUrl || null,
      platform: state.display.provider,
      volume: state.status.volume,
      isReady: state.isReady,
      playbackId: state.playbackId,
      startSeconds: state.source.startSeconds,
      endSeconds: state.source.endSeconds,
      // Legacy
      composerName: state.display.composerName || null,
    }),
    [state],
  );

  const value = useMemo(
    () => ({
      ...flatProperties,
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
      setPlayerInstance,
    }),
    [
      flatProperties,
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
      setPlayerInstance,
    ],
  );

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}

// Extend the interface to include the internal setter
declare module './AudioPlayerContext' {
  interface PlayerActions {
    setPlayerInstance: (instance: PlayerInstanceProxy | null) => void;
  }
}
