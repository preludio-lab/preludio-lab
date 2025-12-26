/**
 * Supported Audio Player Platforms
 */
export const PlayerPlatform = {
    YOUTUBE: 'youtube',
    DEFAULT: 'default',
} as const;

export type PlayerPlatformType = typeof PlayerPlatform[keyof typeof PlayerPlatform];
