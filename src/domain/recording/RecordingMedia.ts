import { z } from 'zod';

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

/**
 * Recording Source
 * 録音の具体的な提供元 (YouTube, Spotify等)
 */
export const RecordingSourceSchema = z.object({
    /** ソースのユニークID (UUID v7) */
    id: z.string().min(1).max(50),
    /** プロバイダ (Enum) */
    provider: z.nativeEnum(RecordingProvider),
    /** 外部サービスのIDまたはURL (最大2048文字) */
    externalSourceId: z.string().min(1).max(2048),
    /** 品質 (Optional) */
    quality: z.nativeEnum(RecordingQuality).optional(),
});

export type RecordingSource = z.infer<typeof RecordingSourceSchema>;

/**
 * Recording Media
 * 録音ソースの集合を管理するモジュール
 */
export const RecordingMediaSchema = z.object({
    /** 録音ソースのリスト (最大50件) */
    sources: z.array(RecordingSourceSchema).max(50).default([]),
});

export type RecordingMedia = z.infer<typeof RecordingMediaSchema>;
