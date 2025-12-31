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
      result.current.play('test-video-id', {
        title: 'Test Song',
        composer: 'Test Artist',
      });
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.src).toBe('test-video-id');
    expect(result.current.title).toBe('Test Song');
    expect(result.current.composer).toBe('Test Artist');
  });

  it('updates platform metadata on play()', () => {
    const { result } = renderHook(() => useAudioPlayer(), {
      wrapper: AudioPlayerProvider,
    });

    act(() => {
      result.current.play('test-video-id', {
        platformUrl: 'https://example.com',
        platformLabel: 'External Link',
        platform: 'default',
      });
    });

    expect(result.current.platformUrl).toBe('https://example.com');
    expect(result.current.platformLabel).toBe('External Link');
    expect(result.current.platform).toBe('default');
  });

  it('shows error toast on invalid play request', async () => {
    const { result } = renderHook(() => useAudioPlayer(), {
      wrapper: AudioPlayerProvider,
    });

    act(() => {
      // Invalid request: endSeconds < startSeconds
      // Arguments: (src, metadata, options)
      result.current.play('test-video-id', undefined, {
        startSeconds: 100,
        endSeconds: 50,
      });
    });

    expect(vi.mocked(toast).error).toHaveBeenCalledWith('invalidRequest');
    expect(result.current.isPlaying).toBe(false);
  });
});
