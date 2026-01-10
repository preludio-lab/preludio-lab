import { WorkPartControl } from './WorkPartControl';
import { WorkPartMetadata } from './WorkPartMetadata';

/**
 * WorkPart Entity
 * 楽曲の構成要素（楽章、曲目等）を表すエンティティ。
 * Identity/制御情報を表す Control と、属性情報を表す Metadata をコーディネートします。
 */
export class WorkPart {
  readonly control: WorkPartControl;
  readonly metadata: WorkPartMetadata;

  constructor(control: WorkPartControl, metadata: WorkPartMetadata) {
    this.control = control;
    this.metadata = metadata;
  }

  get id(): string {
    return this.control.id;
  }

  get workId(): string {
    return this.control.workId;
  }

  get slug(): string {
    return this.control.slug;
  }

  get order(): number {
    return this.control.order;
  }

  get title() {
    return this.metadata.title;
  }

  get description() {
    return this.metadata.description;
  }

  get musicalIdentity() {
    return this.metadata.musicalIdentity;
  }

  get performanceDifficulty() {
    return this.metadata.performanceDifficulty;
  }

  get nicknames() {
    return this.metadata.nicknames;
  }

  /**
   * エンティティの複製 (イミュータブルな更新)
   */
  public cloneWith(props: {
    control?: Partial<WorkPartControl>;
    metadata?: Partial<WorkPartMetadata>;
  }): WorkPart {
    return new WorkPart(
      { ...this.control, ...props.control },
      { ...this.metadata, ...props.metadata },
    );
  }
}
