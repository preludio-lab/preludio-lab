import { WorkControl, WorkId } from './work.control';
import { WorkMetadata } from './work.metadata';

export type { WorkControl, WorkMetadata, WorkId };

/**
 * Work Entity
 * 作品のドメインエンティティ (Aggregate Root)
 * 楽曲のマスタマータとして機能します。
 */
export class Work {
  /** 制御情報 */
  readonly control: WorkControl;
  /** メタデータ */
  readonly metadata: WorkMetadata;

  constructor(props: { control: WorkControl; metadata: WorkMetadata }) {
    this.control = props.control;
    this.metadata = props.metadata;
  }

  // --- Shortcuts for Convenience ---
  get id() {
    return this.control.id;
  }
  get slug() {
    return this.control.slug;
  }
  get composerSlug() {
    return this.control.composerSlug;
  }
  get era() {
    return this.metadata.era;
  }
  get genres() {
    return this.metadata.musicalIdentity?.genres ?? [];
  }
  get title() {
    return this.metadata.titleComponents.title;
  }
  get popularTitle() {
    return this.metadata.titleComponents.nickname;
  }
  get catalogue() {
    const primary =
      this.metadata.catalogues.find((c) => c.isPrimary) ?? this.metadata.catalogues[0];
    const prefix = primary?.prefix ?? '';
    const number = primary?.number ?? '';
    return `${prefix} ${number}`.trim();
  }

  get performanceDifficulty() {
    return this.metadata.performanceDifficulty;
  }

  get instrumentationFlags() {
    return this.metadata.instrumentationFlags;
  }

  // --- Musical Identity Shortcuts ---
  get musicalIdentity() {
    return this.metadata.musicalIdentity;
  }
  get key() {
    return this.musicalIdentity?.key;
  }
  get tempo() {
    return this.musicalIdentity?.tempo;
  }
  get timeSignature() {
    return this.musicalIdentity?.timeSignature;
  }
  get bpm() {
    return this.musicalIdentity?.bpm;
  }
  get metronomeUnit() {
    return this.musicalIdentity?.metronomeUnit;
  }

  /**
   * 多楽章作品かどうか (将来的にフラグまたは WorkPartRepository で判定)
   */
  public hasParts(): boolean {
    return false; // TODO: Phase 7: Implement via flag or repository check
  }

  /**
   * エンティティの複製 (イミュータブルな更新)
   */
  public cloneWith(props: {
    control?: Partial<WorkControl>;
    metadata?: Partial<WorkMetadata>;
  }): Work {
    return new Work({
      control: props.control ? { ...this.control, ...props.control } : this.control,
      metadata: props.metadata ? { ...this.metadata, ...props.metadata } : this.metadata,
    });
  }
}
