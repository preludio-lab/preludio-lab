import { TitleComponents } from './work.shared.js';
import { Catalogue } from './work.shared.js';
import { TITLE_SYNTHESIS_LABELS, SupportedLang } from './work.constants.js';

export interface TitleFormatContext {
  lang: string;
  genreName?: string;
  keyName?: string;
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
  static format(tc: TitleComponents, ctx: TitleFormatContext): string {
    const { lang, genreName, keyName, catalogues } = ctx;
    const langKey = (lang as SupportedLang) || 'en';
    const labels = (TITLE_SYNTHESIS_LABELS as Record<string, TitleSynthesisLabels>)[langKey];

    if (tc.displayType === 'custom') {
      const distinctiveTitle = tc.distinctiveTitle as Record<string, string | undefined>;
      const content = tc.content as Record<string, string | undefined>;
      const sLangKey = langKey as string;
      return distinctiveTitle?.[sLangKey] || content?.[sLangKey] || '';
    }

    const primaryCatalogue =
      (catalogues as Catalogue[])?.find((c) => c.isPrimary) || (catalogues as Catalogue[])?.[0];

    switch (tc.displayType) {
      case 'catalogue-only':
        return this.formatCatalogueOnly(labels, lang, genreName, keyName, primaryCatalogue);
      case 'title-priority':
        return this.formatTitlePriority(tc, labels, lang, keyName, primaryCatalogue);
      case 'standard':
      default:
        return this.formatStandard(tc, labels, lang, genreName, keyName, primaryCatalogue);
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

    if (genreName) {
      const numPart = tc.number ? `${labels.numberPrefix}${tc.number}${labels.numberSuffix}` : '';
      parts.push(`${genreName}${numPart ? ' ' + numPart : ''}`);
    }

    if (keyName) {
      parts.push(`${labels.keyPrefix}${keyName}`);
    }

    const langKey = lang as SupportedLang;
    const sLangKey = langKey as string;
    const nickname = (tc.nickname as Record<string, string | undefined>)?.[sLangKey];
    if (nickname) {
      parts.push(`${labels.nicknamePrefix}${nickname}${labels.nicknameSuffix}`);
    }

    if (catalogue) {
      parts.push(this.formatCatalogue(catalogue, labels, lang));
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
    if (catalogue) parts.push(this.formatCatalogue(catalogue, labels, lang));
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
    const langKey = lang as SupportedLang;
    const sLangKey = langKey as string;
    const distinctiveTitle = tc.distinctiveTitle as Record<string, string | undefined>;
    const title = distinctiveTitle?.[sLangKey];
    if (title) parts.push(title);
    if (keyName) parts.push(`${labels.keyPrefix}${keyName}`);
    if (catalogue) parts.push(this.formatCatalogue(catalogue, labels, lang));
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
