/**
 * 再生バインディング
 * 譜例と特定の録音ソースの再生区間を紐付けます
 */
export interface PlaybackBinding {
    readonly recordingSourceId: string; // recording_sources.id への外部キー
    readonly startSeconds: number;
    readonly endSeconds: number;
    readonly isDefault: boolean;
    readonly label?: string;
}

/**
 * 譜例バインディング
 * 複数の再生バインディングを管理
 */
export interface MusicalExampleBinding {
    readonly playbackBindings: readonly PlaybackBinding[];
}

export const createMusicalExampleBinding = (
    playbackBindings: PlaybackBinding[] = []
): MusicalExampleBinding => ({
    playbackBindings: [...playbackBindings],
});
