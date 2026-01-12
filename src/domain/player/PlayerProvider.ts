import { z } from 'zod';

/**
 * PlayerProvider
 * 再生プラットフォームおよび表示用プロバイダーの共通識別子
 */
export const PlayerProvider = {
    /** YouTube動画 */
    YOUTUBE: 'youtube',
    /** Spotify */
    SPOTIFY: 'spotify',
    /** SoundCloud */
    SOUNDCLOUD: 'soundcloud',
    /** Apple Music */
    APPLE_MUSIC: 'apple-music',
    /** ホストされた音声ファイル (mp3, wav, etc. / Cloudflare R2など) */
    FILES: 'files',
    /** その他・汎用 */
    OTHER: 'other',
} as const;

export type PlayerProvider = (typeof PlayerProvider)[keyof typeof PlayerProvider];

/** Zod Schema for PlayerProvider */
export const PlayerProviderSchema = z.nativeEnum(PlayerProvider);
