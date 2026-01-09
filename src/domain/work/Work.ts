import { WorkControl } from './WorkControl';
import { WorkMetadata, WorkPart } from './WorkMetadata';

export type { WorkControl, WorkMetadata, WorkPart };

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
  get composer() {
    return this.control.composer;
  }
  get title() {
    return this.metadata.title;
  }
  get catalogue() {
    const prefix = this.metadata.cataloguePrefix ?? '';
    const number = this.metadata.catalogueNumber ?? '';
    return `${prefix} ${number}`.trim();
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

  /**
   * 多楽章作品かどうか
   */
  public hasParts(): boolean {
    return this.metadata.parts.length > 0;
  }

  /**
   * エンティティの複製 (イミュータブルな更新)
   */
  public cloneWith(props: { control?: Partial<WorkControl>; metadata?: Partial<WorkMetadata> }): Work {
    return new Work({
      control: props.control ? { ...this.control, ...props.control } : this.control,
      metadata: props.metadata ? { ...this.metadata, ...props.metadata } : this.metadata,
    });
  }
}
