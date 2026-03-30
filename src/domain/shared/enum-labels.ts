import { MusicalEra } from './musical-era';
import { MusicalGenre } from './musical-genre';
import { MusicalInstrument } from './musical-instrument';
import { MusicalKey } from '../work/musical-key';
import { WorkPartType } from '../work/work-part.metadata';
import { taxonomy } from './taxonomy/TaxonomyRegistry';
import { AppLocale } from '../i18n/locale';
import { Nationality } from './nationality';
import { MusicalCataloguePrefix } from '../work/musical-catalogue-prefix';

/**
 * 時代 (MusicalEra) のラベル取得関数のデモ
 * 将来的には、MUSICAL_ERA_LABELS 自体を関数化するか、Contextから取得するように変更します。
 */
export const getMusicalEraLabel = (
  era: MusicalEra,
  locale: AppLocale = 'ja' as AppLocale,
): string => {
  return taxonomy.getLabel('eras', era, locale);
};

// 互換性のためのデフォルト（日本語）
export const MUSICAL_ERA_LABELS: Record<MusicalEra, string> = {
  [MusicalEra.MEDIEVAL]: '中世',
  [MusicalEra.RENAISSANCE]: 'ルネサンス',
  [MusicalEra.BAROQUE]: 'バロック',
  [MusicalEra.CLASSICAL]: '古典派',
  [MusicalEra.EARLY_ROMANTIC]: '前期ロマン派',
  [MusicalEra.MID_ROMANTIC]: '中期ロマン派',
  [MusicalEra.LATE_ROMANTIC]: '後期ロマン派',
  [MusicalEra.IMPRESSIONISM]: '印象主義',
  [MusicalEra.MODERN]: '近代',
  [MusicalEra.CONTEMPORARY]: '現代',
};

/**
 * 調性 (MusicalKey) のラベル取得関数
 */
export const getMusicalKeyLabel = (
  key: MusicalKey,
  locale: AppLocale = 'ja' as AppLocale,
): string => {
  return taxonomy.getLabel('keys', key, locale);
};

/**
 * 調性 (MusicalKey) のラベル定義
 */
export const MUSICAL_KEY_LABELS: Record<MusicalKey, string> = {
  // Major
  [MusicalKey.C_MAJOR]: 'ハ長調',
  [MusicalKey.C_SHARP_MAJOR]: '嬰ハ長調',
  [MusicalKey.D_FLAT_MAJOR]: '変ニ長調',
  [MusicalKey.D_MAJOR]: 'ニ長調',
  [MusicalKey.E_FLAT_MAJOR]: '変ホ長調',
  [MusicalKey.E_MAJOR]: 'ホ長調',
  [MusicalKey.F_MAJOR]: 'ヘ長調',
  [MusicalKey.F_SHARP_MAJOR]: '嬰ヘ長調',
  [MusicalKey.G_FLAT_MAJOR]: '変ト長調',
  [MusicalKey.G_MAJOR]: 'ト長調',
  [MusicalKey.A_FLAT_MAJOR]: '変イ長調',
  [MusicalKey.A_MAJOR]: 'イ長調',
  [MusicalKey.B_FLAT_MAJOR]: '変ロ長調',
  [MusicalKey.B_MAJOR]: 'ロ長調',
  [MusicalKey.C_FLAT_MAJOR]: '変ハ長調',

  // Minor
  [MusicalKey.C_MINOR]: 'ハ短調',
  [MusicalKey.C_SHARP_MINOR]: '嬰ハ短調',
  [MusicalKey.D_MINOR]: 'ニ短調',
  [MusicalKey.D_SHARP_MINOR]: '嬰ニ短調',
  [MusicalKey.E_FLAT_MINOR]: '変ホ短調',
  [MusicalKey.E_MINOR]: 'ホ短調',
  [MusicalKey.F_MINOR]: 'ヘ短調',
  [MusicalKey.F_SHARP_MINOR]: '嬰ヘ短調',
  [MusicalKey.G_MINOR]: 'ト短調',
  [MusicalKey.G_SHARP_MINOR]: '嬰ト短調',
  [MusicalKey.A_MINOR]: 'イ短調',
  [MusicalKey.A_SHARP_MINOR]: '嬰イ短調',
  [MusicalKey.B_FLAT_MINOR]: '変ロ短調',
  [MusicalKey.B_MINOR]: 'ロ短調',
  [MusicalKey.A_FLAT_MINOR]: '変イ短調',

  // Plain
  [MusicalKey.C]: 'ハ調',
  [MusicalKey.C_SHARP]: '嬰ハ調',
  [MusicalKey.D_FLAT]: '変ニ調',
  [MusicalKey.D]: 'ニ調',
  [MusicalKey.D_SHARP]: '嬰ニ調',
  [MusicalKey.E_FLAT]: '変ホ調',
  [MusicalKey.E]: 'ホ調',
  [MusicalKey.F]: 'ヘ調',
  [MusicalKey.F_SHARP]: '嬰ヘ調',
  [MusicalKey.G_FLAT]: '変ト調',
  [MusicalKey.G]: 'ト調',
  [MusicalKey.G_SHARP]: '嬰ト調',
  [MusicalKey.A_FLAT]: '変イ調',
  [MusicalKey.A]: 'イ調',
  [MusicalKey.A_SHARP]: '嬰イ調',
  [MusicalKey.B_FLAT]: '変ロ調',
  [MusicalKey.B]: 'ロ調',
  [MusicalKey.C_FLAT]: '変ハ調',

  [MusicalKey.ATONAL]: '無調',
};

/**
 * 国籍 (Nationality) のラベル取得関数
 */
export const getNationalityLabel = (
  nationality: Nationality | string,
  locale: AppLocale = 'ja' as AppLocale,
): string => {
  return taxonomy.getLabel('nationalities', nationality, locale);
};

/**
 * ジャンル (MusicalGenre) のラベル取得関数
 */
export const getMusicalGenreLabel = (
  genre: string,
  locale: AppLocale = 'ja' as AppLocale,
): string => {
  return taxonomy.getLabel('genres', genre, locale);
};

/**
 * ジャンル (MusicalGenre) のラベル定義
 * ※ネストされているため、フラットなマップとして定義
 */
export const MUSICAL_GENRE_LABELS: Record<string, string> = {
  // Orchestral
  [MusicalGenre.ORCHESTRAL.SYMPHONY]: '交響曲',
  [MusicalGenre.ORCHESTRAL.OVERTURE]: '序曲・前奏曲',
  [MusicalGenre.ORCHESTRAL.TONE_POEM]: '交響詩',
  [MusicalGenre.ORCHESTRAL.SUITE_ORCH]: '管弦楽組曲',
  [MusicalGenre.ORCHESTRAL.SERENADE_DIVERTIMENTO]: 'セレナード・ディヴェルティメント',
  [MusicalGenre.ORCHESTRAL.INCIDENTAL_MUSIC]: '劇付随音楽',

  // Stage
  [MusicalGenre.STAGE.OPERA]: 'オペラ',
  [MusicalGenre.STAGE.OPERETTA]: 'オペレッタ',
  [MusicalGenre.STAGE.BALLET]: 'バレエ音楽',

  // Concerto
  [MusicalGenre.CONCERTO.PIANO_CONCERTO]: 'ピアノ協奏曲',
  [MusicalGenre.CONCERTO.VIOLIN_CONCERTO]: 'ヴァイオリン協奏曲',
  [MusicalGenre.CONCERTO.CELLO_CONCERTO]: 'チェロ協奏曲',
  [MusicalGenre.CONCERTO.WIND_CONCERTO]: '管楽器のための協奏曲',
  [MusicalGenre.CONCERTO.CONCERTO_GROSSO]: '合奏協奏曲',
  [MusicalGenre.CONCERTO.CONCERTED_WORK]: '協奏的楽曲',

  // Chamber
  [MusicalGenre.CHAMBER.CHAMBER_STRINGS]: '弦楽重奏',
  [MusicalGenre.CHAMBER.CHAMBER_PIANO]: 'ピアノ重奏',
  [MusicalGenre.CHAMBER.SONATA_DUO]: '独奏ソナタ（伴奏付）',
  [MusicalGenre.CHAMBER.KEYBOARD_ENSEMBLE]: '鍵盤アンサンブル',
  [MusicalGenre.CHAMBER.CHAMBER_WIND]: '管楽アンサンブル',
  [MusicalGenre.CHAMBER.CHAMBER_MIXED]: '混合・その他アンサンブル',

  // Solo
  [MusicalGenre.SOLO.KEYBOARD_SOLO]: '鍵盤独奏',
  [MusicalGenre.SOLO.STRING_SOLO]: '弦楽器独奏',
  [MusicalGenre.SOLO.WIND_SOLO]: '管楽器独奏',
  [MusicalGenre.SOLO.SOLO_OTHER_INST]: 'その他独奏',

  // Vocal / Choral
  [MusicalGenre.VOCAL_CHORAL.LIED]: '歌曲',
  [MusicalGenre.VOCAL_CHORAL.SONG_CYCLE]: '連作歌曲',
  [MusicalGenre.VOCAL_CHORAL.MASS_REQUIEM]: 'ミサ曲・レクイエム',
  [MusicalGenre.VOCAL_CHORAL.ORATORIO_PASSION]: 'オラトリオ・受難曲',
  [MusicalGenre.VOCAL_CHORAL.CANTATA]: 'カンタータ',
  [MusicalGenre.VOCAL_CHORAL.EARLY_VOCAL]: '古楽声楽曲',
  [MusicalGenre.VOCAL_CHORAL.CHORAL_OTHERS]: 'その他合唱曲',

  // Form (主要なもののみか、全部か検討。ここでは全部網羅)
  [MusicalGenre.FORM.SONATA]: 'ソナタ',
  [MusicalGenre.FORM.SONATA_FORM]: 'ソナタ形式',
  [MusicalGenre.FORM.VARIATIONS]: '変奏曲',
  [MusicalGenre.FORM.FUGUE_COUNTERPOINT]: 'フーガ・対位法',
  [MusicalGenre.FORM.SUITE_PARTITA]: '組曲・パルティータ',
  [MusicalGenre.FORM.RONDO]: 'ロンド',
  [MusicalGenre.FORM.TERNARY_FORM]: '三部形式',
  [MusicalGenre.FORM.BINARY_FORM]: '二部形式',
  [MusicalGenre.FORM.CYCLIC_FORM]: '循環形式',
  [MusicalGenre.FORM.ARIA]: 'アリア',
  [MusicalGenre.FORM.RECITATIVE]: 'レチタティーヴォ',
  [MusicalGenre.FORM.VOCAL_ENSEMBLE]: '重唱',
  [MusicalGenre.FORM.CHORUS_PIECE]: '合唱曲',
  [MusicalGenre.FORM.MASS_ORDINARY]: 'ミサ通常文',
  [MusicalGenre.FORM.REQUIEM_FORM]: 'レクイエム形式',
  [MusicalGenre.FORM.PASSION_STRUCTURE]: '受難曲構造',
  [MusicalGenre.FORM.CHORALE]: 'コラール',
  [MusicalGenre.FORM.MOTET]: 'モテット',
  [MusicalGenre.FORM.MADRIGAL]: 'マドリガル',
  [MusicalGenre.FORM.LIED_SONG]: '歌曲・リート',
  [MusicalGenre.FORM.SONG_CYCLE_STRUCTURE]: '連作歌曲（歌曲集）',
  [MusicalGenre.FORM.STROPHIC]: '有節形式',
  [MusicalGenre.FORM.THROUGH_COMPOSED]: '通奏形式',
  [MusicalGenre.FORM.VOCALISE]: 'ヴォカリーズ',
  [MusicalGenre.FORM.PRELUDE]: '前奏曲',
  [MusicalGenre.FORM.NOCTURNE]: '夜想曲',
  [MusicalGenre.FORM.IMPROMPTU]: '即興曲',
  [MusicalGenre.FORM.SCHERZO]: 'スケルツォ',
  [MusicalGenre.FORM.BALLADE]: 'バラード',
  [MusicalGenre.FORM.FANTASIA]: '幻想曲',
  [MusicalGenre.FORM.INTERMEZZO]: '間奏曲',
  [MusicalGenre.FORM.BAGATELLE]: 'バガテル',
  [MusicalGenre.FORM.HUMORESQUE]: 'ユモレスク',
  [MusicalGenre.FORM.ROMANCE]: 'ロマンス',
  [MusicalGenre.FORM.ARABESQUE]: 'アラベスク',
  [MusicalGenre.FORM.BARCAROLLE_BERCEUSE]: '舟歌・子守歌',
  [MusicalGenre.FORM.ELEGY]: '悲歌',
  [MusicalGenre.FORM.ETUDE]: '練習曲',
  [MusicalGenre.FORM.TOCCATA]: 'トッカータ',
  [MusicalGenre.FORM.CAPRICE_CAPRICCIO]: '奇想曲',
  [MusicalGenre.FORM.RHAPSODY]: '狂詩曲',
  [MusicalGenre.FORM.TRANSCRIPTION_PARAPHRASE]: 'パラフレーズ・編曲',
  [MusicalGenre.FORM.CONCERT_PIECE]: '演奏会用楽曲',
  [MusicalGenre.FORM.CADENZA]: 'カデンツァ',
  [MusicalGenre.FORM.STYLE_BRILLANT]: '華麗なる様式',
  [MusicalGenre.FORM.ALLEMANDE]: 'アルマンド',
  [MusicalGenre.FORM.COURANTE]: 'クーラント',
  [MusicalGenre.FORM.SARABANDE]: 'サラバンド',
  [MusicalGenre.FORM.GIGUE]: 'ジーグ',
  [MusicalGenre.FORM.GAVOTTE]: 'ガヴォット',
  [MusicalGenre.FORM.BOURREE]: 'ブーレ',
  [MusicalGenre.FORM.PASSEPIED]: 'パスピエ',
  [MusicalGenre.FORM.MINUET]: 'メヌエット',
  [MusicalGenre.FORM.WALTZ]: 'ワルツ',
  [MusicalGenre.FORM.POLONAISE]: 'ポロネーズ',
  [MusicalGenre.FORM.MAZURKA]: 'マズルカ',
  [MusicalGenre.FORM.MARCH]: '行進曲',
  [MusicalGenre.FORM.TARANTELLA]: 'タランテラ',
  [MusicalGenre.FORM.BOLERO_HABANERA]: 'ボレロ・ハバネラ',
  [MusicalGenre.FORM.CZARDAS]: 'チャールダーシュ',
  [MusicalGenre.FORM.POLKA]: 'ポルカ',
  [MusicalGenre.FORM.GALOP]: 'ギャロップ',
  [MusicalGenre.FORM.PAVANE_GALLIARD]: 'パヴァーヌ・ガリアルド',
  [MusicalGenre.FORM.PASSACAGLIA]: 'パッサカリア',
  [MusicalGenre.FORM.CHACONNE]: 'シャコンヌ',
  [MusicalGenre.FORM.BASSO_OSTINATO]: '固執低音',
  [MusicalGenre.FORM.FOLIA]: 'フォリア',
  [MusicalGenre.FORM.SYMPHONIC_POEM_STRUCTURE]: '交響詩的構造',
  [MusicalGenre.FORM.PROGRAM_SYMPHONY_FORM]: '標題交響曲形式',
  [MusicalGenre.FORM.LEITMOTIF_SYSTEM]: 'ライトモティーフ体系',
  [MusicalGenre.FORM.IDEE_FIXE]: '固定観念',
  [MusicalGenre.FORM.MELODRAME]: 'メロドラマ',
  [MusicalGenre.FORM.WORD_PAINTING]: '語画法',
};

/**
 * 作品番号接頭辞 (MusicalCataloguePrefix) のラベル取得関数
 */
export const getCataloguePrefixLabel = (
  prefix: MusicalCataloguePrefix | string,
  locale: AppLocale = 'ja' as AppLocale,
): string => {
  return taxonomy.getLabel('catalogue_prefixes', prefix, locale);
};

/**
 * 楽器 (MusicalInstrument) のラベル取得関数
 */
export const getMusicalInstrumentLabel = (
  instrument: MusicalInstrument,
  locale: AppLocale = 'ja' as AppLocale,
): string => {
  return taxonomy.getLabel('instruments', instrument, locale);
};

/**
 * 楽器 (MusicalInstrument) のラベル定義
 */
export const MUSICAL_INSTRUMENT_LABELS: Record<MusicalInstrument, string> = {
  // Keyboard
  [MusicalInstrument.PIANO]: 'ピアノ',
  [MusicalInstrument.ORGAN]: 'オルガン',
  [MusicalInstrument.HARPSICHORD]: 'チェンバロ',
  [MusicalInstrument.FORTEPIANO]: 'フォルテピアノ',
  [MusicalInstrument.CELESTA]: 'チェレスタ',
  [MusicalInstrument.CLAVICHORD]: 'クラヴィコード',
  [MusicalInstrument.VIRGINAL]: 'バージナル',
  [MusicalInstrument.SPINET]: 'スピネット',
  [MusicalInstrument.HARMONIUM]: 'ハルモニウム',
  [MusicalInstrument.GLASS_HARMONICA]: 'グラスハーモニカ',
  [MusicalInstrument.PORTATIVE_ORGAN]: 'ポルタティフ・オルガン',
  [MusicalInstrument.ELECTRONIC_KEYBOARD]: '電子キーボード',

  // Strings
  [MusicalInstrument.VIOLIN]: 'ヴァイオリン',
  [MusicalInstrument.VIOLA]: 'ヴィオラ',
  [MusicalInstrument.CELLO]: 'チェロ',
  [MusicalInstrument.DOUBLE_BASS]: 'コントラバス',
  [MusicalInstrument.VIOLA_DA_GAMBA]: 'ヴィオラ・ダ・ガンバ',
  [MusicalInstrument.VIOLA_D_AMORE]: 'ヴィオラ・ダモーレ',
  [MusicalInstrument.PERIOD_STRINGS]: '古楽器弦楽器',
  [MusicalInstrument.VIOLONCELLO_PICCOLO]: 'ヴィオロンチェロ・ピッコロ',
  [MusicalInstrument.VIOLONE]: 'ヴィオローネ',
  [MusicalInstrument.VIOLINO_PICCOLO]: 'ヴィオリーノ・ピッコロ',
  [MusicalInstrument.BARYTON]: 'バリトン',
  [MusicalInstrument.ARPEGGIONE]: 'アルペジョーネ',

  // Woodwinds
  [MusicalInstrument.FLUTE]: 'フルート',
  [MusicalInstrument.PICCOLO]: 'ピッコロ',
  [MusicalInstrument.ALTO_FLUTE]: 'アルト・フルート',
  [MusicalInstrument.OBOE]: 'オーボエ',
  [MusicalInstrument.ENGLISH_HORN]: 'イングリッシュ・ホルン',
  [MusicalInstrument.CLARINET]: 'クラリネット',
  [MusicalInstrument.E_FLAT_CLARINET]: '小クラリネット',
  [MusicalInstrument.BASS_CLARINET]: 'バスクラリネット',
  [MusicalInstrument.BASSOON]: 'ファゴット',
  [MusicalInstrument.CONTRABASSOON]: 'コントラファゴット',
  [MusicalInstrument.RECORDER]: 'リコーダー',
  [MusicalInstrument.SAXOPHONE]: 'サクソフォン',
  [MusicalInstrument.TRAVERSO]: 'フラウト・トラヴェルソ',
  [MusicalInstrument.BASSET_HORN]: 'バセットホルン',
  [MusicalInstrument.BASSET_CLARINET]: 'バセットクラリネット',
  [MusicalInstrument.OBOE_D_AMORE]: 'オーボエ・ダモーレ',
  [MusicalInstrument.OBOE_DA_CACCIA]: 'オーボエ・ダ・カッチャ',
  [MusicalInstrument.BAROQUE_OBOE]: 'バロック・オーボエ',
  [MusicalInstrument.HECKELPHONE]: 'ヘッケルフォーン',

  // Brass
  [MusicalInstrument.HORN]: 'ホルン',
  [MusicalInstrument.WAGNER_TUBA]: 'ワーグナー・テューバ',
  [MusicalInstrument.TRUMPET]: 'トランペット',
  [MusicalInstrument.CORNET]: 'コルネット',
  [MusicalInstrument.TROMBONE]: 'トロンボーン',
  [MusicalInstrument.TUBA]: 'テューバ',
  [MusicalInstrument.EUPHONIUM]: 'ユーフォニアム',
  [MusicalInstrument.NATURAL_TRUMPET]: 'ナチュラルトランペット',
  [MusicalInstrument.NATURAL_HORN]: 'ナチュラルホルン',
  [MusicalInstrument.PICCOLO_TRUMPET]: 'ピッコロトランペット',
  [MusicalInstrument.FLUGELHORN]: 'フリューゲルホルン',
  [MusicalInstrument.BASS_TROMBONE]: 'バストロンボーン',
  [MusicalInstrument.ZINK]: 'ツィンク',
  [MusicalInstrument.OPHICLEIDE]: 'オフィクレイド',

  // Voice
  [MusicalInstrument.SOPRANO]: 'ソプラノ',
  [MusicalInstrument.MEZZO_SOPRANO]: 'メゾ・ソプラノ',
  [MusicalInstrument.ALTO]: 'アルト',
  [MusicalInstrument.CONTRALTO]: 'コントラルト',
  [MusicalInstrument.COUNTERTENOR]: 'カウンターテナー',
  [MusicalInstrument.TENOR]: 'テノール',
  [MusicalInstrument.BARITONE]: 'バリトン',
  [MusicalInstrument.BASS]: 'バス',
  [MusicalInstrument.BOY_SOPRANO]: 'ボーイ・ソプラノ',
  [MusicalInstrument.CASTRATO]: 'カストラート',
  [MusicalInstrument.BASS_PROFUNDO]: 'バス・プロフルンド',
  [MusicalInstrument.CHOIR_MIXED]: '混声合唱',
  [MusicalInstrument.CHOIR_MALE]: '男声合唱',
  [MusicalInstrument.CHOIR_FEMALE]: '女声合唱',
  [MusicalInstrument.CHOIR_CHILDREN]: '児童合唱',

  // Percussion
  [MusicalInstrument.TIMPANI]: 'ティンパニ',
  [MusicalInstrument.GLOCKENSPIEL]: 'グロッケンシュピール',
  [MusicalInstrument.XYLOPHONE]: 'シロフォン',
  [MusicalInstrument.VIBRAPHONE]: 'ヴィブラフォン',
  [MusicalInstrument.MARIMBA]: 'マリンバ',
  [MusicalInstrument.SNARE_DRUM]: 'スネアドラム',
  [MusicalInstrument.BASS_DRUM]: 'バスドラム',
  [MusicalInstrument.CYMBALS]: 'シンバル',
  [MusicalInstrument.TRIANGLE]: 'トライアングル',
  [MusicalInstrument.PERCUSSION_GENERAL]: '打楽器全般',
  [MusicalInstrument.TUBULAR_BELLS]: 'チューブラー・ベル',
  [MusicalInstrument.TAM_TAM]: 'タムタム',
  [MusicalInstrument.CASTANETS]: 'カスタネット',
  [MusicalInstrument.TAMBOURINE]: 'タンバリン',
  [MusicalInstrument.XYLORIMBA]: 'シロマリンバ',
  [MusicalInstrument.HAMMER]: 'ハンマー',
  [MusicalInstrument.BELLS]: 'ベル',

  // Plucked Strings
  [MusicalInstrument.GUITAR]: 'ギター',
  [MusicalInstrument.LUTE]: 'リュート',
  [MusicalInstrument.MANDOLIN]: 'マンドリン',
  [MusicalInstrument.HARP]: 'ハープ',
  [MusicalInstrument.THEORBO]: 'テオルボ',
  [MusicalInstrument.BAROQUE_GUITAR]: 'バロック・ギター',
  [MusicalInstrument.VIHUELA]: 'ビウエラ',
  [MusicalInstrument.LYRE]: 'リラ',
  [MusicalInstrument.ZITHER]: 'ツィター',
  [MusicalInstrument.BALALAIKA]: 'バラライカ',

  // Others
  [MusicalInstrument.BASSO_CONTINUO]: '通奏低音',
  [MusicalInstrument.ELECTRONICS]: '電子音響',
};

/**
 * 印象スケール (ImpressionScale) のラベル取得関数
 */
export const getImpressionScaleLabel = (
  scaleId: string,
  locale: AppLocale = 'ja' as AppLocale,
): string => {
  return taxonomy.getLabel('impression_scales', scaleId, locale);
};

/**
 * 専門記事レベル (ReadingLevel) のラベル取得関数
 */
export const getReadingLevelLabel = (
  level: string | number,
  locale: AppLocale = 'ja' as AppLocale,
): string => {
  return taxonomy.getLabel('reading_levels', level, locale);
};

/**
 * 演奏難易度 (PerformanceDifficulty) のラベル取得関数
 */
export const getPerformanceDifficultyLabel = (
  difficulty: string | number,
  locale: AppLocale = 'ja' as AppLocale,
): string => {
  return taxonomy.getLabel('performance_difficulty', difficulty, locale);
};

/**
 * トレンドレベル (TrendingLevel) のラベル取得関数
 */
export const getTrendingLevelLabel = (
  level: string,
  locale: AppLocale = 'ja' as AppLocale,
): string => {
  return taxonomy.getLabel('trending_levels', level, locale);
};

/**
 * 楽章タイプ (WorkPartType) のラベル取得関数
 */
export const getWorkPartTypeLabel = (
  type: WorkPartType,
  locale: AppLocale = 'ja' as AppLocale,
): string => {
  return taxonomy.getLabel('work_part_types', type, locale);
};

/**
 * 楽章タイプ (WorkPartType) のラベル定義
 */
export const WORK_PART_TYPE_LABELS: Record<WorkPartType, string> = {
  movement: '楽章',
  number: '番号',
  act: '幕',
  scene: '場面・景',
  variation: '変奏',
  section: 'セクション',
  part: '部',
  interlude: '間奏曲',
  supplement: '付録/補遺',
};
