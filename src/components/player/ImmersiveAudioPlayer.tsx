'use client';

import React, { useRef, useState } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { useTranslations } from 'next-intl';
import { PlayerProvider, PlayerMode } from '@/domain/player/player';
// Helper for time formatting if not available
const formatTimeHelper = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const cleanSeconds = Math.floor(seconds);
  const m = Math.floor(cleanSeconds / 60);
  const s = cleanSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export function ImmersiveAudioPlayer() {
  const {
    mode,
    setMode,
    title,
    composerName,
    performer,
    thumbnail,
    platformUrl,
    platform,
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    seekTo,
    startSeconds,
    endSeconds,
  } = useAudioPlayer();

  const t = useTranslations('Player');

  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  if (mode !== PlayerMode.IMMERSIVE) return null;

  // Virtual Timeline Calculations
  const startOffset = startSeconds ?? 0;
  const endCap = endSeconds !== undefined ? endSeconds : duration;
  // Prevent negative duration if data isn't ready
  const displayDuration = Math.max(0, endCap - startOffset);
  // Clamp current time to 0 for UI (don't show negative if player is buffering before start)
  const rawDisplayTime = Math.max(0, currentTime - startOffset);

  // Use drag value if dragging, otherwise actual time
  const currentUiTime = isDragging ? dragTime : rawDisplayTime;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDragTime(Number(e.target.value));
  };

  const handleSeekStart = () => {
    setIsDragging(true);
    setDragTime(rawDisplayTime);
  };

  const handleSeekEnd = () => {
    setIsDragging(false);
    // Convert UI time back to absolute time
    seekTo(dragTime + startOffset);
  };

  const handleSkipBackward = () => {
    // Skip -10s relative to absolute time, but clamped to startOffset
    const newTime = Math.max(startOffset, currentTime - 10);
    seekTo(newTime);
  };

  const handleSkipForward = () => {
    // Skip +10s relative to absolute time, but clamped to endCap
    const newTime = Math.min(endCap, currentTime + 10);
    seekTo(newTime);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white/95 backdrop-blur-sm text-preludio-black animate-in slide-in-from-bottom duration-300">
      {/* Header: Minimize Button */}
      <div className="flex items-center justify-between px-6 py-8">
        <button
          onClick={() => setMode(PlayerMode.MINI)}
          className="p-3 -ml-3 text-3xl text-gray-400 hover:text-preludio-black transition-colors rounded-full hover:bg-gray-100"
          aria-label="Minimize Player"
        >
          <span className="block transform rotate-180">⌃</span> {/* Clean minimize icon */}
        </button>
        <div className="text-sm font-bold tracking-widest uppercase text-gray-500">Now Playing</div>
        <div className="w-8" /> {/* Spacer for balance */}
      </div>

      {/* Content: Artwork & Info */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
        {/* Artwork Placeholder - Dynamic shadow based on playing state */}
        <div
          className={`
                    w-64 h-64 sm:w-80 sm:h-80 bg-gray-100 rounded-2xl shadow-2xl 
                    transition-transform duration-700 ease-out border border-gray-200 overflow-hidden
                    ${isPlaying ? 'scale-100' : 'scale-95 opacity-90'}
                `}
        >
          {thumbnail ? (
            <img src={thumbnail} alt={title || 'Artwork'} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              {/* Music Note Icon */}
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <h2 className="text-2xl font-serif font-bold text-preludio-black leading-tight max-w-md mx-auto">
            {title || 'Unknown Title'}
          </h2>
          <p className="text-lg text-classic-gold font-medium">
            {composerName || 'Unknown Composer'}
          </p>
          {performer && <p className="text-sm text-gray-500 font-medium">{performer}</p>}

          {/* Attribution Link */}
          {platformUrl && (
            <a
              href={platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (isPlaying) togglePlay();
              }}
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-medium text-gray-400 border border-gray-200 hover:text-preludio-black hover:border-gray-400 transition-all group"
            >
              {/* Icon Switcher based on platform */}
              {platform === PlayerProvider.YOUTUBE ? (
                <svg
                  className="w-3 h-3 transition-colors group-hover:text-[#FF0000]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              ) : (
                /* Default External Link Icon */
                <svg
                  className="w-3 h-3 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              )}

              <span>{t(`provider.${platform || 'generic'}`)}</span>
              <span className="w-px h-3 bg-gray-300 mx-1"></span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-12 sm:px-12 max-w-3xl mx-auto w-full space-y-6">
        {/* Seek Bar */}
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={displayDuration || 100}
            value={currentUiTime}
            onChange={handleSeekChange}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchStart={handleSeekStart}
            onTouchEnd={handleSeekEnd}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-classic-gold"
          />
          <div className="flex justify-between text-xs font-mono text-gray-500">
            <span>{formatTimeHelper(currentUiTime)}</span>
            <span>
              {endSeconds === undefined && duration === 0
                ? '--:--'
                : formatTimeHelper(displayDuration)}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-12">
          <button
            onClick={handleSkipBackward}
            className="text-4xl text-gray-400 hover:text-preludio-black transition-colors active:scale-95"
            aria-label="Skip Backward 10s"
          >
            ⏮ <span className="text-xs block text-center font-sans mt-1">-10s</span>
          </button>
          <button
            onClick={togglePlay}
            className="flex items-center justify-center w-20 h-20 bg-preludio-black text-paper-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg text-4xl pl-1"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={handleSkipForward}
            className="text-4xl text-gray-400 hover:text-preludio-black transition-colors active:scale-95"
            aria-label="Skip Forward 10s"
          >
            ⏭ <span className="text-xs block text-center font-sans mt-1">+10s</span>
          </button>
        </div>
      </div>
    </div>
  );
}
