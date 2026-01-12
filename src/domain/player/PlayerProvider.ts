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
    /** 音声ファイル (mp3, wav, etc. / 特定プラットフォームに依存しないファイル直接再生) */
    AUDIO_FILE: 'audio-file',
    /** その他・汎用 (特定のブランドや独自UIを持たないもの) */
    GENERIC: 'generic',
} as const;

export type PlayerProvider = (typeof PlayerProvider)[keyof typeof PlayerProvider];

/** Zod Schema for PlayerProvider */
export const PlayerProviderSchema = z.nativeEnum(PlayerProvider);
