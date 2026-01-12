'use client';

import { useAudioPlayer } from './AudioPlayerContext';
import { PlayerMode } from '@/domain/player/Player';

/**
 * [REQ-UI-004-02] Mini Player
 * Persistent audio player bar fixed at the bottom.
 */
export function MiniAudioPlayer() {
  const {
    mode,
    setMode,
    title,
    composerName,
    performer,
    thumbnail,
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    seekTo,
    startSeconds,
    endSeconds,
  } = useAudioPlayer();

  if (mode === PlayerMode.HIDDEN || mode === PlayerMode.IMMERSIVE) return null;

  // Virtual Timeline Calculations
  const startOffset = startSeconds || 0;
  const endCap = endSeconds || duration;
  const displayDuration = Math.max(0, endCap - startOffset);
  const rawDisplayTime = Math.max(0, currentTime - startOffset);

  // Progress % based on virtual range
  const progressPercent = displayDuration > 0 ? (rawDisplayTime / displayDuration) * 100 : 0;

  const handleSkipBackward = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTime = Math.max(startOffset, currentTime - 10);
    seekTo(newTime);
  };

  const handleSkipForward = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newTime = Math.min(endCap, currentTime + 10);
    seekTo(newTime);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md transition-all duration-300 shadow-up">
      {/* Progress Bar */}
      <div
        className="h-1 w-full bg-gray-200 cursor-pointer group"
        onClick={() => setMode(PlayerMode.IMMERSIVE)}
      >
        <div
          className="h-full bg-accent transition-all duration-300 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Track Info */}
        <div
          className="flex items-center gap-4 cursor-pointer flex-1"
          onClick={() => setMode(PlayerMode.IMMERSIVE)}
          role="button"
          aria-label="Open Full Player"
        >
          {/* Artwork */}
          <div
            className={`h-10 w-10 bg-gray-300 rounded-md flex-shrink-0 overflow-hidden relative ${isPlaying ? 'animate-pulse-slow' : ''}`}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={title || 'Artwork'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-sm font-bold text-neutral-800 truncate">{title}</h3>
            <p className="text-xs text-neutral-500 truncate">
              {composerName || 'Unknown Composer'}
              {performer && ` • ${performer}`}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button
            onClick={handleSkipBackward}
            className="hidden sm:block p-2 text-gray-600 hover:text-preludio-black transition-colors"
            aria-label="Skip Backward 10s"
          >
            ⏮
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-preludio-black text-paper-white hover:bg-gray-800 transition-colors shadow-md text-lg"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={handleSkipForward}
            className="hidden sm:block p-2 text-gray-600 hover:text-preludio-black transition-colors"
            aria-label="Skip Forward 10s"
          >
            ⏭
          </button>
        </div>

        {/* Mode Toggle (Hidden on mobile as clicking the bar expands it) */}
        <div className="hidden sm:block ml-6 pl-6 border-l border-gray-200">
          <button
            onClick={() => setMode(PlayerMode.IMMERSIVE)}
            className="text-xs font-semibold uppercase tracking-wider text-classic-gold hover:underline"
          >
            Expand
          </button>
        </div>
      </div>
    </div>
  );
}
