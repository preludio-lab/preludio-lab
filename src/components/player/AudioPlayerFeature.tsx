'use client';

import React from 'react';
import AudioPlayerController from './AudioPlayerController';
import { FocusAudioPlayer } from './FocusAudioPlayer';
import { MiniAudioPlayer } from './MiniAudioPlayer';

/**
 * [REQ-UI-PLAYER-FEATURE] Audio Player Feature Entry Point
 *
 * Player機能全体を構成するコンポーネント群を束ねて提供します。
 * layout.tsx 等で配置することで、以下の機能が有効になります:
 * 1. AudioPlayerController: 音声再生ロジックと外部サービス連携
 * 2. MiniAudioPlayer: 画面下部の常駐プレイヤー
 * 3. FocusAudioPlayer: 全画面プレイヤー
 */
export default function AudioPlayerFeature() {
  return (
    <>
      {/* Logic & Audio Engine (Headless) */}
      <AudioPlayerController />

      {/* UI Components */}
      <MiniAudioPlayer />
      <FocusAudioPlayer />
    </>
  );
}
