import { z } from '@/shared/validation/zod';

/**
 * Nationality (国籍)
 * 主要な音楽関連国のISO 3166-1 alpha-2コードを定義。
 * Taxonomy準拠。
 */
export const Nationality = {
  // --- Europe (Central) ---
  /** ドイツ (Germany) */
  DE: 'DE',
  /** オーストリア (Austria) */
  AT: 'AT',
  /** スイス (Switzerland): オネゲル（6人組）のルーツ、亡命時代のワーグナー、現代音楽の拠点（ザッハー基金など）。 */
  CH: 'CH',
  /** チェコ (Czech Republic) */
  CZ: 'CZ',
  /** スロバキア (Slovakia): チェコと密接に関わりつつも、フンメル（Hummel）の生誕地であり、独自の東欧情緒を持つ。 */
  SK: 'SK',
  /** ハンガリー (Hungary) */
  HU: 'HU',

  // --- Europe (Western) ---
  /** フランス (France) */
  FR: 'FR',
  /** ベルギー (Belgium) */
  BE: 'BE',
  /** オランダ (Netherlands): スウェーリンク（バロック）から、現代の古楽演奏（レオンハルト、ブリュッヘン等）の聖地。 */
  NL: 'NL',
  /** イギリス (United Kingdom) */
  GB: 'GB',
  /** アイルランド (Ireland): フィールド（John Field）がノクターンを創始した地であり、英国とは異なるケルティックな音楽性。 */
  IE: 'IE',

  // --- Europe (Southern) ---
  /** イタリア (Italy) */
  IT: 'IT',
  /** スペイン (Spain) */
  ES: 'ES',
  /** ポルトガル (Portugal): 独自のバロック音楽や、ピリス（Maria João Pires）などの世界的ピアニストの輩出。 */
  PT: 'PT',
  /** ギリシャ (Greece): カラス（Maria Callas）やミトロプーロス、現代ではクセナキスなど、強烈な個性を生んだ地。 */
  GR: 'GR',

  // --- Europe (Northern) ---
  /** フィンランド (Finland) */
  FI: 'FI',
  /** ノルウェー (Norway) */
  NO: 'NO',
  /** デンマーク (Denmark) */
  DK: 'DK',
  /** スウェーデン (Sweden): 北欧音楽の重要な一角。ベルワルド、アルヴェーン、現代の合唱音楽。 */
  SE: 'SE',

  // --- Europe (Eastern) & Russia ---
  /** ロシア (Russia) */
  RU: 'RU',
  /** ポーランド (Poland) */
  PL: 'PL',
  /** ウクライナ (Ukraine) */
  UA: 'UA',
  /** エストニア (Estonia): アルヴォ・ペルトに代表される「聖なるミニマリズム」と、世界最高峰の合唱文化。 */
  EE: 'EE',
  /** ルーマニア (Romania): エネスク（エネスコ）の祖国であり、リパッティやハスキルなど偉大なピアニストの宝庫。 */
  RO: 'RO',

  // --- Americas (North) ---
  /** アメリカ (United States) */
  US: 'US',
  /** カナダ (Canada): グレン・グールド（Glenn Gould）の母国。ケント・ナガノや現代の有力なオーケストラ文化。 */
  CA: 'CA',

  // --- Americas (Latin) ---
  /** ブラジル (Brazil) */
  BR: 'BR',
  /** アルゼンチン (Argentina) */
  AR: 'AR',
  /** メキシコ (Mexico): ポンセやチャベス、レブエルタスなど、南米とはまた異なる中米の色彩感。 */
  MX: 'MX',
  /** ベネズエラ (Venezuela): エル・システマの本拠地。ドゥダメルやアバドゆかりのユースオーケストラ文化。 */
  VE: 'VE',
  /** キューバ (Cuba): ブロウエル（Brouwer）など、現代ギター音楽やラテン・クラシックの最重要拠点. */
  CU: 'CU',

  // --- Asia ---
  /** 日本 (Japan) */
  JP: 'JP',
  /** 中国 (China) */
  CN: 'CN',
  /** 韓国 (South Korea): 現代の国際コンクールを席巻。チョ・ソンジンやイム・ユンチャンなど、今のクラシック界を牽引。 */
  KR: 'KR',
  /** 台湾 (Taiwan): アジアにおけるクラシック受容が非常に高く、多くの世界的器楽奏者を輩出。 */
  TW: 'TW',

  // --- Caucasus / Middle East ---
  /** アルメニア (Armenia): ハチャトゥリアンに代表される、コーカサス地方特有のリズムと旋律。 */
  AM: 'AM',
  /** ジョージア (Georgia): 旧ソ連圏の中でも特に個性的。ギヤ・カンチェリや、現代の世界的演奏家の宝庫。 */
  GE: 'GE',
  /** トルコ (Turkey): 「トルコ行進曲」の着想源（メフテル）としての歴史から、現代のサイ（Fazıl Say）まで。 */
  TR: 'TR',

  // --- Oceania ---
  /** オーストラリア (Australia): サザーランド（Joan Sutherland）などの名歌手や、シドニー・オペラハウスを中心とした南半球の拠点。 */
  AU: 'AU',

  // --- Africa ---
  /** エジプト (Egypt): 『アイーダ』の舞台であり、カイロ・オペラハウスを中心としたアフリカ最大の拠点。 */
  EG: 'EG',
  /** 南アフリカ (South Africa): 現代オペラ界を支える、世界最高レベルの歌手たち（ソプラノ等）を数多く輩出。 */
  ZA: 'ZA',
} as const;

export type Nationality = (typeof Nationality)[keyof typeof Nationality];

export const NationalitySchema = z.nativeEnum(Nationality);
