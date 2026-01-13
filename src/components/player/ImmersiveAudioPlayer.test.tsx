import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { ImmersiveAudioPlayer } from './ImmersiveAudioPlayer';
import { AudioPlayerContext } from './AudioPlayerContext';

const messages = {
  Player: {
    invalidRequest: 'Invalid playback request',
    provider: {
      youtube: 'Watch on YouTube',
      spotify: 'Listen on Spotify',
      soundcloud: 'Listen on SoundCloud',
      'apple-music': 'Listen on Apple Music',
      'audio-file': 'Play Audio',
      generic: 'Play',
    },
  },
};

// Mock context value helper
const mockContextValue = (overrides = {}) => ({
  isPlaying: false,
  src: null,
  currentTime: 0,
  duration: 0,
  volume: 100,
  mode: 'immersive' as const,
  title: 'Test Title',
  composerName: 'Test Composer',
  performer: 'Test Performer',
  thumbnail: null,
  platformUrl: null,
  platformLabel: null,
  platform: null,
  isReady: true,
  play: vi.fn(),
  pause: vi.fn(),
  togglePlay: vi.fn(),
  seekTo: vi.fn(),
  setVolume: vi.fn(),
  setMode: vi.fn(),
  setPlayerInstance: vi.fn(),
  _onReady: vi.fn(),
  _onStateChange: vi.fn(),
  _onProgress: vi.fn(),
  _onDuration: vi.fn(),
  startSeconds: undefined,
  endSeconds: undefined,
  playbackId: 0,
  ...overrides,
});

describe('ImmersiveAudioPlayer', () => {
  it('renders metadata correctly', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AudioPlayerContext.Provider value={mockContextValue()}>
          <ImmersiveAudioPlayer />
        </AudioPlayerContext.Provider>
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Composer')).toBeInTheDocument();
  });

  it('renders "Watch on YouTube" link when platform data is provided', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AudioPlayerContext.Provider
          value={mockContextValue({
            platformUrl: 'https://youtube.com/watch?v=123',
            platformLabel: 'Watch on YouTube',
            platform: 'youtube',
          })}
        >
          <ImmersiveAudioPlayer />
        </AudioPlayerContext.Provider>
      </NextIntlClientProvider>,
    );

    const link = screen.getByText('Watch on YouTube').closest('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://youtube.com/watch?v=123');
  });

  it('does not render link if platformUrl is missing', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AudioPlayerContext.Provider
          value={mockContextValue({
            platformUrl: null,
          })}
        >
          <ImmersiveAudioPlayer />
        </AudioPlayerContext.Provider>
      </NextIntlClientProvider>,
    );

    expect(screen.queryByText('Watch on YouTube')).not.toBeInTheDocument();
  });
});
