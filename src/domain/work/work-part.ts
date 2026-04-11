import { WorkPartControl, WorkPartId } from './work-part.control.js';
import { WorkPartMetadata } from './work-part.metadata.js';
import { WorkTitleFormatter } from './work-title-formatter.js';
import { supportedLocales } from '../i18n/locale.js';

export type { WorkPartControl, WorkPartMetadata, WorkPartId };

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
    const result: Record<string, string> = {};
    for (const locale of supportedLocales) {
      result[locale] = WorkTitleFormatter.format({
        components: this.metadata.titleComponents,
        genres: this.musicalIdentity?.genres ?? [],
        key: this.musicalIdentity?.key,
        catalogues: this.metadata.catalogues,
        locale,
      });
    }
    return result;
  }

  get popularTitle() {
    return this.metadata.titleComponents.nickname;
  }

  get description() {
    return this.metadata.description;
  }

  get type() {
    return this.metadata.type;
  }

  get isNameStandard() {
    return this.metadata.isNameStandard;
  }

  get musicalIdentity() {
    return this.metadata.musicalIdentity;
  }

  get performanceDifficulty() {
    return this.metadata.performanceDifficulty;
  }

  get instruments() {
    return this.metadata.instruments;
  }

  get nicknames() {
    return this.metadata.nicknames;
  }

  get impressionDimensions() {
    return this.metadata.impressionDimensions;
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
