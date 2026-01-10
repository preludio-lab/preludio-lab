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
  /** スイス (Switzerland): オネゲル（6人組）のルーツ、亡命時代のワーグナー、現代音楽の拠点（ザッハー基金など）。 */
  CH: 'CH',
  /** オランダ (Netherlands): スウェーリンク（バロック）から、現代の古楽演奏（レオンハルト、ブリュッヘン等）の聖地。 */
  NL: 'NL',
  /** スウェーデン (Sweden): 北欧音楽の重要な一角。ベルワルド、アルヴェーン、現代の合唱音楽。 */
  SE: 'SE',
  /** エストニア (Estonia): アルヴォ・ペルトに代表される「聖なるミニマリズム」と、世界最高峰の合唱文化。 */
  EE: 'EE',
  /** ルーマニア (Romania): エネスク（エネスコ）の祖国であり、リパッティやハスキルなど偉大なピアニストの宝庫。 */
  RO: 'RO',
  /** アルメニア (Armenia): ハチャトゥリアンに代表される、コーカサス地方特有のリズムと旋律。 */
  AM: 'AM',
  /** 韓国 (South Korea): 現代の国際コンクールを席巻。チョ・ソンジンやイム・ユンチャンなど、今のクラシック界を牽引。 */
  KR: 'KR',
  /** 台湾 (Taiwan): アジアにおけるクラシック受容が非常に高く、多くの世界的器楽奏者を輩出。 */
  TW: 'TW',
  /** メキシコ (Mexico): ポンセやチャベス、レブエルタスなど、南米とはまた異なる中米の色彩感。 */
  MX: 'MX',
  /** ベネズエラ (Venezuela): エル・システマの本拠地。ドゥダメルやアバドゆかりのユースオーケストラ文化。 */
  VE: 'VE',
  /** エジプト (Egypt): 『アイーダ』の舞台であり、カイロ・オペラハウスを中心としたアフリカ最大の拠点。 */
  EG: 'EG',
  /** 南アフリカ (South Africa): 現代オペラ界を支える、世界最高レベルの歌手たち（ソプラノ等）を数数多く輩出。 */
  ZA: 'ZA',
} as const;

export type Nationality = (typeof Nationality)[keyof typeof Nationality];

export const NationalitySchema = z.nativeEnum(Nationality);
