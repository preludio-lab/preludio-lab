import { z } from 'zod';

/**
 * Recording Provider
 * 録音ソースの提供元
 */
export const RecordingProvider = {
    /** YouTube (映像付き/音声のみ) */
    YOUTUBE: 'youtube',
    /** Spotify */
    SPOTIFY: 'spotify',
    /** Apple Music / iTunes */
    APPLE_MUSIC: 'apple_music',
    /** SoundCloud */
    SOUNDCLOUD: 'soundcloud',
    /** 独自のストレージ (Cloudflare R2, S3等) に配置された音声ファイル */
    LOCAL_FILE: 'local_file',
} as const;

export type RecordingProvider = (typeof RecordingProvider)[keyof typeof RecordingProvider];

/**
 * Recording Audio Quality
 * 音源の品質レベル
 */
export const RecordingAudioQuality = {
    /** 標準品質 (Standard) - 日常的な視聴に適したレベル */
    STANDARD: 'standard',
    /** 高音質 (High Quality) - 音楽的な細部を楽しめる優れたレベル */
    HIGH: 'high',
    /** 最高品質 (Premium) - 原音に近い、極めて没入感の高い究極のレベル */
    PREMIUM: 'premium',
} as const;


export type RecordingAudioQuality = (typeof RecordingAudioQuality)[keyof typeof RecordingAudioQuality];

/**
 * Recording Source
 * 録音の具体的な提供元と、そのサービス内での識別子
 */
export const RecordingSourceSchema = z.object({
    /** ソースのユニークID (システム内部用 UUID v7) */
    id: z.string().min(1).max(50),
    /** プロバイダ (Enum) */
    provider: z.nativeEnum(RecordingProvider),
    /** プロバイダ内での識別子 (動画ID、URI、パスなど) */
    sourceId: z.string().min(1).max(2048),
    /** 
     * 音声の品質レベル 
     * ユースケース: 
     * 1. 自動選択: ユーザーの通信環境や設定に応じて、最適なソースを自動的に選択する (例: Wi-Fi時はHIGH/PREMIUM、モバイル通信時はSTANDARD)
     * 2. UI表示: 「PREMIUM」バッジを表示し、音源の価値をユーザーに伝える
     */

    quality: z.nativeEnum(RecordingAudioQuality).optional(),
});

export type RecordingSource = z.infer<typeof RecordingSourceSchema>;

/**
 * Recording Sources
 * 録音に関連付けられたソースの集合を管理するモジュール
 */
export const RecordingSourcesSchema = z.object({
    /** 録音ソースのリスト (最大50件) */
    items: z.array(RecordingSourceSchema).max(50).default([]),
});

export type RecordingSources = z.infer<typeof RecordingSourcesSchema>;
