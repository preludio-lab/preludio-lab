import { TitleComponents, Catalogue } from './work.shared';
import { TITLE_SYNTHESIS_LABELS, SupportedLang } from './work.constants';
import { getMusicalGenreLabel, getMusicalKeyLabel } from '../shared/enum-labels';
import { AppLocale, MultilingualString } from '../i18n/locale';
import { MusicalKey } from './musical-key';

export interface TitleFormatContext {
  locale: string;
  genres?: string[];
  key?: string;
  catalogues?: Catalogue[];
}

interface TitleSynthesisLabels {
  numberPrefix: string;
  numberSuffix: string;
  opusPrefix: string;
  keyPrefix: string;
  nicknamePrefix: string;
  nicknameSuffix: string;
}

/**
 * 楽曲タイトルを事実（Fact）から多言語合成するドメインサービス
 */
export class WorkTitleFormatter {
  /**
   * 楽曲タイトルを合成します
   */
  static format(ctx: TitleFormatContext & { components: TitleComponents }): string {
    const { locale, genres, key, catalogues, components: tc } = ctx;
    const langKey = (locale as SupportedLang) || 'en';
    const labels = (TITLE_SYNTHESIS_LABELS as Record<string, TitleSynthesisLabels>)[langKey];

    // 1. エスケープハッチ: Custom
    if (tc.displayType === 'custom') {
      const distinctiveTitle = (tc.distinctiveTitle as MultilingualString | undefined)?.[
        langKey as AppLocale
      ];
      if (distinctiveTitle) {
        return distinctiveTitle;
      }
    }

    const primaryCatalogue =
      (catalogues as Catalogue[])?.find((c) => c.isPrimary) || (catalogues as Catalogue[])?.[0];

    const genreName = genres?.[0]
      ? getMusicalGenreLabel(genres[0], langKey as AppLocale)
      : undefined;
    const keyName = key ? getMusicalKeyLabel(key as MusicalKey, langKey as AppLocale) : undefined;

    // 2. 合成パターン別処理
    switch (tc.displayType) {
      case 'catalogue-only':
        return this.formatCatalogueOnly(labels, langKey, genreName, keyName, primaryCatalogue);
      case 'title-priority':
        return this.formatTitlePriority(tc, labels, langKey, keyName, primaryCatalogue);
      case 'standard':
      default:
        return this.formatStandard(tc, labels, langKey, genreName, keyName, primaryCatalogue);
    }
  }

  private static formatStandard(
    tc: TitleComponents,
    labels: TitleSynthesisLabels,
    lang: string,
    genreName?: string,
    keyName?: string,
    catalogue?: Catalogue,
  ): string {
    const parts: string[] = [];

    // [Genre + Number]
    if (genreName) {
      const numPart = tc.number ? `${labels.numberPrefix}${tc.number}${labels.numberSuffix}` : '';
      parts.push(
        `${genreName}${numPart ? (lang === 'ja' || lang === 'zh' ? '' : ' ') + numPart : ''}`,
      );
    } else if (tc.number) {
      // ジャンルがないが番号がある場合（稀だが念のため）
      parts.push(`${labels.numberPrefix}${tc.number}${labels.numberSuffix}`);
    }

    // [Key]
    if (keyName) {
      parts.push(`${labels.keyPrefix}${keyName}`);
    }

    // [Nickname]
    const nickname = (tc.nickname as MultilingualString | undefined)?.[lang as AppLocale];
    if (nickname) {
      parts.push(`${labels.nicknamePrefix}${nickname}${labels.nicknameSuffix}`);
    }

    // [Catalogue]
    if (catalogue) {
      const catStr = this.formatCatalogue(catalogue, labels, lang);
      if (catStr) parts.push(catStr);
    }

    return parts.filter(Boolean).join(' ');
  }

  private static formatCatalogueOnly(
    labels: TitleSynthesisLabels,
    lang: string,
    genreName?: string,
    keyName?: string,
    catalogue?: Catalogue,
  ): string {
    const parts: string[] = [];
    if (genreName) parts.push(genreName);
    if (keyName) parts.push(`${labels.keyPrefix}${keyName}`);
    if (catalogue) {
      const catStr = this.formatCatalogue(catalogue, labels, lang);
      if (catStr) parts.push(catStr);
    }
    return parts.filter(Boolean).join(' ');
  }

  private static formatTitlePriority(
    tc: TitleComponents,
    labels: TitleSynthesisLabels,
    lang: string,
    keyName?: string,
    catalogue?: Catalogue,
  ): string {
    const parts: string[] = [];
    const distinctiveTitle = (tc.distinctiveTitle as MultilingualString | undefined)?.[
      lang as AppLocale
    ];
    if (distinctiveTitle) parts.push(distinctiveTitle);
    if (keyName) parts.push(`${labels.keyPrefix}${keyName}`);
    if (catalogue) {
      const catStr = this.formatCatalogue(catalogue, labels, lang);
      if (catStr) parts.push(catStr);
    }
    return parts.filter(Boolean).join(' ');
  }

  private static formatCatalogue(
    catalogue: Catalogue,
    labels: TitleSynthesisLabels,
    lang: string,
  ): string {
    if (!catalogue.prefix || !catalogue.number) return '';

    if (catalogue.prefix === 'op-posth') {
      if (lang === 'ja') return `${labels.opusPrefix}${catalogue.number} (遺作)`;
      if (lang === 'zh') return `${labels.opusPrefix}${catalogue.number} (遗作)`;
      return `Op. posth. ${catalogue.number}`;
    }

    if (catalogue.prefix === 'op') {
      return `${labels.opusPrefix}${catalogue.number}`;
    }

    const upperPrefix = catalogue.prefix.toUpperCase();
    let displayPrefix = upperPrefix;
    if (upperPrefix === 'K') displayPrefix = 'K.';
    if (upperPrefix === 'KK') displayPrefix = 'Kk.';

    return `${displayPrefix} ${catalogue.number}`;
  }
}
