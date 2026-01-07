/**
 * Recording Provider
 * 録音ソースの提供元
 */
export const RecordingProvider = {
    YOUTUBE: 'youtube',
    SPOTIFY: 'spotify',
} as const;

export type RecordingProvider = (typeof RecordingProvider)[keyof typeof RecordingProvider];

/**
 * Recording Quality
 * 音質/画質の識別子 (プロバイダ依存)
 */
export const RecordingQuality = {
    /** 標準 (Standard / Default) */
    SD: 'sd',
    /** 高画質 (HD / 720p+) */
    HD: 'hd',
    /** 高音質 (High Bitrate) */
    HIGH_AUDIO: 'high_audio',
} as const;

export type RecordingQuality = (typeof RecordingQuality)[keyof typeof RecordingQuality];
