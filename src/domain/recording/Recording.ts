import { RecordingControl } from './RecordingControl';
import { RecordingMetadata } from './RecordingMetadata';
import { RecordingSources } from './RecordingSources';

/**
 * Recording Entity
 * 録音のドメインエンティティ (Aggregate Root / Coordinator)
 * 各モジュール (Control, Metadata, Sources) を束ね、整合性を管理する。
 */
export class Recording {
  /** 制御情報 (ID, Lifecycle) */
  readonly control: RecordingControl;
  /** メタデータ (Performer, Year) */
  readonly metadata: RecordingMetadata;
  /** 音源情報 (Items) */
  readonly sources: RecordingSources;

  constructor(props: {
    control: RecordingControl;
    metadata: RecordingMetadata;
    sources: RecordingSources;
  }) {
    this.control = props.control;
    this.metadata = props.metadata;
    this.sources = props.sources;
  }

  // --- Shortcuts for Convenience (Delegation) ---

  get id() {
    return this.control.id;
  }
  get workId() {
    return this.control.workId;
  }
  get performerName() {
    return this.metadata.performerName;
  }
  get recordingYear() {
    return this.metadata.recordingYear;
  }
  get isRecommended() {
    return this.metadata.isRecommended;
  }
  get sourceItems() {
    return this.sources.items;
  }

  /**
   * エンティティの複製 (イミュータブルな更新)
   */
  public cloneWith(props: {
    control?: Partial<RecordingControl>;
    metadata?: Partial<RecordingMetadata>;
    sources?: Partial<RecordingSources>;
  }): Recording {
    return new Recording({
      control: props.control ? { ...this.control, ...props.control } : this.control,
      metadata: props.metadata ? { ...this.metadata, ...props.metadata } : this.metadata,
      sources: props.sources ? { ...this.sources, ...props.sources } : this.sources,
    });
  }
}
