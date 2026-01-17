import { ComposerControl } from './composer.control';
import { ComposerMetadata } from './composer-metadata';

export type { ComposerControl, ComposerMetadata };

/**
 * Composer Entity
 * 作曲家のドメインエンティティ (Aggregate Root)
 * 楽曲の創造者としてのマスタデータです。
 */
export class Composer {
  /** 制御情報 */
  readonly control: ComposerControl;
  /** メタデータ */
  readonly metadata: ComposerMetadata;

  constructor(props: { control: ComposerControl; metadata: ComposerMetadata }) {
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

  get fullName() {
    return this.metadata.fullName;
  }

  get displayName() {
    return this.metadata.displayName;
  }

  get shortName() {
    return this.metadata.shortName;
  }

  get era() {
    return this.metadata.era;
  }

  get biography() {
    return this.metadata.biography;
  }

  get birthDate() {
    return this.metadata.birthDate;
  }

  get deathDate() {
    return this.metadata.deathDate;
  }

  get nationalityCode() {
    return this.metadata.nationalityCode;
  }

  get representativeInstruments() {
    return this.metadata.representativeInstruments ?? [];
  }

  get representativeGenres() {
    return this.metadata.representativeGenres ?? [];
  }

  get places() {
    return this.metadata.places ?? [];
  }

  get portrait() {
    return this.metadata.portrait;
  }

  get tags() {
    return this.metadata.tags ?? [];
  }

  /**
   * 印象次元 (Impression Dimensions)
   */
  get impressionDimensions() {
    return this.metadata.impressionDimensions;
  }

  /** 革新性 */
  get innovation() {
    return this.metadata.impressionDimensions?.innovation;
  }

  /** 情動性 */
  get emotionality() {
    return this.metadata.impressionDimensions?.emotionality;
  }

  /** 民族性 */
  get nationalism() {
    return this.metadata.impressionDimensions?.nationalism;
  }

  /** 規模感 */
  get scale() {
    return this.metadata.impressionDimensions?.scale;
  }

  /** 複雑性 */
  get complexity() {
    return this.metadata.impressionDimensions?.complexity;
  }

  /** 演劇性 */
  get theatricality() {
    return this.metadata.impressionDimensions?.theatricality;
  }

  /**
   * エンティティの複製 (イミュータブルな更新)
   */
  public cloneWith(props: {
    control?: Partial<ComposerControl>;
    metadata?: Partial<ComposerMetadata>;
  }): Composer {
    return new Composer({
      control: props.control ? { ...this.control, ...props.control } : this.control,
      metadata: props.metadata ? { ...this.metadata, ...props.metadata } : this.metadata,
    });
  }
}
