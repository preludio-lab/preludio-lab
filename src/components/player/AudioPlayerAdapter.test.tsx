import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AudioPlayerAdapter } from './AudioPlayerAdapter';

// Mock react-youtube
vi.mock('react-youtube', () => {
  return {
    default: (props: { videoId?: string; onReady?: (event: { target: unknown }) => void }) => {
      // Simulate onReady execution immediately for testing
      setTimeout(() => {
        const mockTarget = {
          getDuration: () => 120,
          loadVideoById: vi.fn(),
          cueVideoById: vi.fn(),
          playVideo: vi.fn(),
          pauseVideo: vi.fn(),
          seekTo: vi.fn(),
          setVolume: vi.fn(),
          getVideoData: () => ({ video_id: props.videoId }), // Mock current video
          getPlayerState: () => -1, // Unstarted
        };
        if (props.onReady) {
          props.onReady({ target: mockTarget });
        }
      }, 0);
      return <div data-testid="youtube-mock" />;
    },
  };
});

describe('AudioPlayerAdapter Component', () => {
  const mockOnReady = vi.fn();
  const mockOnProgress = vi.fn();
  const mockOnEnded = vi.fn();
  const mockOnError = vi.fn();
  const mockOnStateChange = vi.fn();

  const defaultProps = {
    src: 'initial-video-id',
    isPlaying: true, // Set to true to bypass lazy loading for tests
    volume: 80,
    onReady: mockOnReady,
    onProgress: mockOnProgress,
    onEnded: mockOnEnded,
    onError: mockOnError,
    onStateChange: mockOnStateChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<AudioPlayerAdapter {...defaultProps} />);
    // Wait for lazy load state update
    await screen.findByTestId('youtube-mock');
    expect(screen.getByTestId('youtube-mock')).toBeDefined();
  });

  it('calls onReady when player is ready', async () => {
    render(<AudioPlayerAdapter {...defaultProps} />);
    // Wait for usage of setTimeout in mock
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mockOnReady).toHaveBeenCalled();
    expect(mockOnReady).toHaveBeenCalledWith(120); // mocked duration
  });

  // Note: Deeper integration testing of useEffect logic (e.g. loadVideoById calls)
  // requires capturing the mock instance from the child component.
  // Since we mocked the implementation of the child component above, we can't easily access the spy functions
  // without more complex mocking setup or ref forwarding.
  // For unit testing a "Wrapper" component, verifying it passes props correctly and handles events is sufficient.
});
