'use client';

import React, { useEffect, useRef } from 'react';
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube';
import { AudioPlayerAdapterProps } from '@/components/player/AudioPlayerAdapter';

/**
 * [INFRASTRUCTURE] YouTube Host Configuration
 * Defined here as it's an implementation detail of the adapter.
 */
const YOUTUBE_EMBED_HOST = 'https://www.youtube-nocookie.com';

/**
 * [INFRASTRUCTURE] YouTube Adapter
 *
 * react-youtube ライブラリを使用した AudioPlayer の具体的な実装。
 * AudioPlayer (Dumb Component) から呼び出され、YouTube IFrame API との通信を担当する。
 */
export function YouTubeAdapter({
  src,
  isPlaying,
  volume,
  seekTo,
  startTime,
  endTime,
  playbackId,
  onReady,
  onProgress,
  onDuration,
  onEnded,
  onError,
  onStateChange,
}: AudioPlayerAdapterProps) {
  const playerRef = useRef<any>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const lastPlaybackIdRef = useRef<number | undefined>(undefined);
  const lastSeekToRef = useRef<number | null | undefined>(undefined);

  // YouTube Player のオプション設定
  const opts: YouTubeProps['opts'] = {
    height: '1',
    width: '1',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      playsinline: 1,
      modestbranding: 1,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
    host: YOUTUBE_EMBED_HOST,
  };

  // loadVideoById を安全に呼び出すヘルパー関数
  const safeLoadVideo = (
    target: any,
    options: { videoId: string; startSeconds?: number; endSeconds?: number },
  ) => {
    try {
      console.debug('[YouTubeAdapter] 動画ロード開始:', options);
      const result = target.loadVideoById(options);
      if (result && typeof result.catch === 'function') {
        result.catch((e: any) => {
          console.error('[YouTubeAdapter] 非同期ロードエラー:', e);
          onError(e);
        });
      }
    } catch (e) {
      console.error('[YouTubeAdapter] 同期ロードエラー:', e);
      onError(e);
    }
  };

  /**
   * Effect: 再生状態とソース変更のハンドリング
   */
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !src) return;

    // 新しい「再生リクエスト」かどうかを判定 (例: 新しい曲のクリック)
    const isNewRequest = playbackId !== lastPlaybackIdRef.current;
    const currentVideoId = player.getVideoData()?.video_id;

    if (isPlaying) {
      if (isNewRequest || currentVideoId !== src) {
        // 新しい動画をロード
        lastPlaybackIdRef.current = playbackId;
        const loadOpts: any = {
          videoId: src,
          startSeconds: startTime || 0,
        };
        if (endTime) loadOpts.endSeconds = endTime;
        safeLoadVideo(player, loadOpts);
      } else {
        // 既存の動画を再開
        const playerState = player.getPlayerState();
        if (playerState !== 1) {
          // 再生中でなければ
          player.playVideo();
        }
      }
    } else {
      const playerState = player.getPlayerState();
      if (playerState === 1) {
        // 再生中なら
        player.pauseVideo();
      }
    }
  }, [isPlaying, src, startTime, endTime, playbackId]);

  /**
   * Effect: シーク処理のハンドリング
   */
  useEffect(() => {
    if (seekTo !== undefined && seekTo !== null && seekTo !== lastSeekToRef.current) {
      lastSeekToRef.current = seekTo;
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seekTo, true);
      }
    }
  }, [seekTo]);

  /**
   * Effect: 音量のハンドリング
   */
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  /**
   * Effect: 再生時間のポーリング
   */
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const time = playerRef.current.getCurrentTime();
          onProgress(time);

          // 終了時間の監視 (手動チェック)
          if (endTime && time >= endTime) {
            playerRef.current.pauseVideo();
            if (onStateChange) onStateChange(false);
          }
        }
      }, 500);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, onProgress, endTime, onStateChange]);

  // --- Event Handlers ---

  const _onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    const duration = event.target.getDuration();
    onReady(duration);

    // 初期ロード制御（srcがある場合）
    if (src) {
      const loadOpts: any = { videoId: src, startSeconds: startTime || 0 };
      if (endTime) loadOpts.endSeconds = endTime;

      // 準備完了時点ですぐに操作可能になるよう調整
      if (isPlaying) {
        safeLoadVideo(event.target, loadOpts);
      } else {
        event.target.cueVideoById(loadOpts);
      }
    }
  };

  const _onStateChange = (event: YouTubeEvent) => {
    // PlayerState: -1 (未開始), 0 (終了), 1 (再生中), 2 (一時停止), 3 (バッファリング), 5 (キュー済み).
    const state = event.data;
    const duration = event.target.getDuration();
    if (duration > 0) {
      // 必要に応じてDurationを更新（ライブ配信やロード完了時など）
      if (onDuration) onDuration(duration);
    }

    if (state === 1) {
      // 再生中
      if (onStateChange) onStateChange(true);
    } else if (state === 2) {
      // 一時停止
      if (onStateChange) onStateChange(false);
    } else if (state === 0) {
      // 終了
      if (onStateChange) onStateChange(false);
      onEnded();
    }
  };

  const _onError = (event: any) => {
    // react-youtube は onError イベントオブジェクトを返すが、実際のエラーコードは event.data にある
    console.error('[YouTubeAdapter] 内部エラーイベント:', event);
    onError(event.data);
  };

  return (
    <YouTube
      videoId={undefined} // 手動制御のため undefined
      opts={opts}
      onReady={_onReady}
      onStateChange={_onStateChange}
      onError={_onError}
    />
  );
}
