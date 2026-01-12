import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AudioPlayerProvider, useAudioPlayer } from './AudioPlayerContext';
import { toast } from 'react-hot-toast';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('react-hot-toast', () => {
  const error = vi.fn();
  const m = {
    error,
    success: vi.fn(),
  };
  return {
    toast: m,
    default: m,
  };
});

describe('AudioPlayerContext', () => {
  it('provides default values', () => {
    const { result } = renderHook(() => useAudioPlayer(), {
      wrapper: AudioPlayerProvider,
    });

    expect(result.current.mode).toBe('hidden');
    expect(result.current.isPlaying).toBe(false);
  });

  it('updates state on play()', () => {
    const { result } = renderHook(() => useAudioPlayer(), {
      wrapper: AudioPlayerProvider,
    });

    act(() => {
      result.current.play({
        sourceId: 'test-video-id',
        provider: 'youtube', // default
        startSeconds: 0,
        endSeconds: 100,
        title: 'Test Song',
        composerName: 'Test Artist',
      });
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.src).toBe('test-video-id');
    expect(result.current.title).toBe('Test Song');
    expect(result.current.composerName).toBe('Test Artist');
  });

  it('updates platform metadata on play()', () => {
    const { result } = renderHook(() => useAudioPlayer(), {
      wrapper: AudioPlayerProvider,
    });

    act(() => {
      result.current.play({
        sourceId: 'test-video-id',
        provider: 'generic',
        startSeconds: 0,
        endSeconds: undefined,
        title: 'Platform Test',
        sourceUrl: 'https://example.com',
        providerLabel: 'External Link',
      });
    });

    expect(result.current.platformUrl).toBe('https://example.com');
    expect(result.current.platformLabel).toBe('External Link');
    expect(result.current.platform).toBe('generic');
  });

  it('shows error toast on invalid play request', async () => {
    const { result } = renderHook(() => useAudioPlayer(), {
      wrapper: AudioPlayerProvider,
    });

    act(() => {
      // Invalid request: endSeconds < startSeconds
      result.current.play({
        sourceId: 'test-video-id',
        provider: 'youtube',
        startSeconds: 100,
        endSeconds: 50,
        title: 'Invalid Sample',
      });
    });

    expect(vi.mocked(toast).error).toHaveBeenCalledWith('invalidRequest');
    expect(result.current.isPlaying).toBe(false);
  });
});
