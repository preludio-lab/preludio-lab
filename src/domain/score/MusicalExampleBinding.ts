import { z } from 'zod';

/**
 * 再生バインディングの Zod スキーマ
 */
export const PlaybackBindingSchema = z.object({
    /** 録音ソースID */
    recordingSourceId: z.string().min(1).max(50),
    /** 再生開始秒数 (0〜86400: 24h) */
    startSeconds: z.number().nonnegative().max(86400),
    /** 再生終了秒数 */
    endSeconds: z.number().nonnegative().max(86400),
    /** デフォルト音源フラグ */
    isDefault: z.boolean(),
    /** 識別用ラベル (例: "Theme A") */
    label: z.string().max(20).optional(),
});

export type PlaybackBinding = z.infer<typeof PlaybackBindingSchema>;

/**
 * 譜例バインディングの Zod スキーマ
 */
export const MusicalExampleBindingSchema = z.object({
    /** 複数の再生バインディング (最大10件) */
    playbackBindings: z.array(PlaybackBindingSchema).max(10).default([]),
});

export type MusicalExampleBinding = z.infer<typeof MusicalExampleBindingSchema>;

/**
 * MusicalExampleBinding の生成
 */
export const createMusicalExampleBinding = (
    playbackBindings: any[] = []
): MusicalExampleBinding => {
    return MusicalExampleBindingSchema.parse({
        playbackBindings,
    });
};
