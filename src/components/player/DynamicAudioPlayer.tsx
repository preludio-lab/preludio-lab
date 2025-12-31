'use client';

import dynamic from 'next/dynamic';

import { useAudioPlayer } from './AudioPlayerContext';

const AudioPlayerFeature = dynamic(() => import('./AudioPlayerFeature'), { ssr: false });

export function DynamicAudioPlayer() {
  const { mode, src } = useAudioPlayer();

  // True Lazy Loading:
  // Only fetch and render the heavy player bundle when it's actually needed.
  // If the player is hidden and has no content, we render nothing.
  if (mode === 'hidden' && !src) {
    return null;
  }

  return <AudioPlayerFeature />;
}
