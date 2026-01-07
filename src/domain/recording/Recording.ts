import { RecordingControl } from './RecordingControl';
import { RecordingMetadata } from './RecordingMetadata';
import { RecordingMedia } from './RecordingMedia';

/**
 * Recording Entity
 * 録音のドメインエンティティ (Aggregate Root / Coordinator)
 * 各モジュール (Control, Metadata, Media) を束ね、整合性を管理する。
 */
export class Recording {
    /** 制御情報 (ID, Lifecycle) */
    readonly control: RecordingControl;
    /** メタデータ (Performer, Year) */
    readonly metadata: RecordingMetadata;
    /** メディア情報 (Sources) */
    readonly media: RecordingMedia;

    constructor(props: {
        control: RecordingControl;
        metadata: RecordingMetadata;
        media: RecordingMedia;
    }) {
        this.control = props.control;
        this.metadata = props.metadata;
        this.media = props.media;
    }

    // --- Shortcuts for Convenience (Delegation) ---

    get id() { return this.control.id; }
    get workId() { return this.control.workId; }
    get performerName() { return this.metadata.performerName; }
    get recordingYear() { return this.metadata.recordingYear; }
    get isRecommended() { return this.metadata.isRecommended; }
    get sources() { return this.media.sources; }

    /**
     * エンティティの複製 (イミュータブルな更新)
     */
    public cloneWith(props: {
        control?: Partial<RecordingControl>;
        metadata?: Partial<RecordingMetadata>;
        media?: Partial<RecordingMedia>;
    }): Recording {
        return new Recording({
            control: props.control ? { ...this.control, ...props.control } : this.control,
            metadata: props.metadata ? { ...this.metadata, ...props.metadata } : this.metadata,
            media: props.media ? { ...this.media, ...props.media } : this.media,
        });
    }
}
