'use client';

import React from 'react';
import { YouTubeAdapter } from '@/infrastructure/player/adapters/YouTubeAdapter';
import { PlayerProvider } from '@/domain/player/Player';

export interface AudioPlayerAdapterProps {
  // State (データ)
  src: string; // 動画ID または URL
  platform?: PlayerProvider; // 将来的な拡張用、現状は youtube のみ実装

  // Control State (制御状態)
  isPlaying: boolean;
  volume: number; // 0-100
  seekTo?: number | null; // シーク位置 (命令的なトリガー)

  // Configuration (設定)
  startTime?: number;
  endTime?: number;
  playbackId?: number; // オプション: 再同期や再ロードを強制するためのID

  // Events (イベント)
  onReady: (duration: number) => void;
  onProgress: (currentTime: number) => void;
  onDuration?: (duration: number) => void;
  onEnded: () => void;
  onError: (error: any) => void;
  onStateChange?: (isPlaying: boolean) => void;
}

/**
 * [REQ-UI-AUDIO-PLAYER] Audio Player Adapter (Dumb Component / Interface)
 *
 * 下位のプレイヤーライブラリを抽象化し、統一された Props 駆動のインターフェースを提供します。
 * `platform` プロパティに基づいて適切なアダプター（現在は YouTubeAdapter のみ）を選択してレンダリングします。
 */
export function AudioPlayerAdapter(props: AudioPlayerAdapterProps) {
  const { platform = PlayerProvider.YOUTUBE, isPlaying } = props;
  const [hasStarted, setHasStarted] = React.useState(false);

  // Strict Lazy Loading:
  // YouTubeのアダプター（iframe等）は、最初の再生リクエストがあるまでマウントしない。
  // これにより、初期ロード時の巨大なリソース読み込み (base.js, videoplayback等) を回避する。
  React.useEffect(() => {
    if (isPlaying && !hasStarted) {
      setHasStarted(true);
    }
  }, [isPlaying, hasStarted]);

  if (platform !== PlayerProvider.YOUTUBE) {
    return <div className="hidden">Unsupported Platform</div>;
  }

  if (!hasStarted) {
    return null; // まだ再生されていない場合は何もレンダリングしない
  }

  return (
    <div className="fixed bottom-0 left-0 -z-50 opacity-0 pointer-events-none" aria-hidden="true">
      <YouTubeAdapter {...props} />
    </div>
  );
}
