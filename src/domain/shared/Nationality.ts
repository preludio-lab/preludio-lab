import { z } from '@/shared/validation/zod';

/**
 * Nationality (国籍)
 * 主要な音楽関連国のISO 3166-1 alpha-2コードを定義。
 * Taxonomy準拠。
 */
export const Nationality = {
    /** ドイツ (Germany) */
    DE: 'DE',
    /** オーストリア (Austria) */
    AT: 'AT',
    /** フランス (France) */
    FR: 'FR',
    /** ベルギー (Belgium) */
    BE: 'BE',
    /** イギリス (United Kingdom) */
    GB: 'GB',
    /** イタリア (Italy) */
    IT: 'IT',
    /** スペイン (Spain) */
    ES: 'ES',
    /** フィンランド (Finland) */
    FI: 'FI',
    /** ノルウェー (Norway) */
    NO: 'NO',
    /** デンマーク (Denmark) */
    DK: 'DK',
    /** ロシア (Russia) */
    RU: 'RU',
    /** ポーランド (Poland) */
    PL: 'PL',
    /** チェコ (Czech Republic) */
    CZ: 'CZ',
    /** ハンガリー (Hungary) */
    HU: 'HU',
    /** ウクライナ (Ukraine) */
    UA: 'UA',
    /** アメリカ (United States) */
    US: 'US',
    /** ブラジル (Brazil) */
    BR: 'BR',
    /** アルゼンチン (Argentina) */
    AR: 'AR',
    /** 日本 (Japan) */
    JP: 'JP',
    /** 中国 (China) */
    CN: 'CN',
} as const;

export type Nationality = (typeof Nationality)[keyof typeof Nationality];

export const NationalitySchema = z.nativeEnum(Nationality);
