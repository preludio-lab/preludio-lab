import { z } from '@/shared/validation/zod';

/**
 * Musical Instrument (楽器)
 * Taxonomy準拠の楽器ID定義。
 * カテゴリ構造はコメントで表現し、値はフラットなEnumとして定義。
 */
export const MusicalInstrument = {
    // --- Keyboard (鍵盤楽器) ---
    PIANO: 'piano',
    ORGAN: 'organ',
    HARPSICHORD: 'harpsichord',
    FORTEPIANO: 'fortepiano',
    CELESTA: 'celesta',
    CLAVICHORD: 'clavichord',
    /** 16-17世紀に普及した小型の撥弦鍵盤楽器。イギリス・バージナル楽派の解説に必須 */
    VIRGINAL: 'virginal',
    /** 翼型ではない小型のチェンバロ。バロック期の室内楽や家庭用楽器の分類として */
    SPINET: 'spinet',
    /** 19世紀に普及したリードオルガン。ドヴォルザークやシュトラウスのスコア、サロン音楽に登場 */
    HARMONIUM: 'harmonium',
    /** モーツァルトが楽曲を残しており、その特殊な音色への言及が没入感に繋がる */
    GLASS_HARMONICA: 'glass-harmonica',
    /** 中世〜ルネサンス期の持ち運び可能な小型オルガン。古楽コンテンツの精度向上のため */
    PORTATIVE_ORGAN: 'portative-organ',
    /** 現代作品やクロスオーバー作品における電子的な鍵盤楽器の総称 */
    ELECTRONIC_KEYBOARD: 'electronic-keyboard',

    // --- Strings (弦楽器) ---
    VIOLIN: 'violin',
    VIOLA: 'viola',
    CELLO: 'cello',
    DOUBLE_BASS: 'double-bass',
    VIOLA_DA_GAMBA: 'viola-da-gamba',
    VIOLA_D_AMORE: 'viola-d-amore',
    /** バロック・ヴァイオリン、バロック・チェロ等。ピリオド奏法の解説とモダン楽器の区別に必須 */
    PERIOD_STRINGS: 'period-strings',
    /** バロック期に多用された、5本以上の弦を持つ低域楽器。J.S.バッハの楽曲等に登場 */
    VIOLONCELLO_PICCOLO: 'violoncello-piccolo',
    /** ヴィオラ・ダ・ガンバ属の最低域楽器。ハイドンが愛好したバリトンなども含む歴史的低弦 */
    VIOLONE: 'violone',
    /** ヴァイオリンより一回り小さく、高い調弦を持つ楽器。バッハのブランデンブルク協奏曲第1番で使用 */
    VIOLINO_PICCOLO: 'violino-piccolo',
    /** ヴィオラ・ダ・ガンバに近いが、共鳴弦を持つ特殊な楽器。ハイドンの膨大な作品群に必須 */
    BARYTON: 'baryton',
    /** アルペジョーネ・ソナタで有名な、ギターのようにフレットがあるチェロに近い楽器 */
    ARPEGGIONE: 'arpeggione',

    // --- Woodwinds (木管楽器) ---
    FLUTE: 'flute',
    PICCOLO: 'piccolo',
    ALTO_FLUTE: 'alto-flute',
    OBOE: 'oboe',
    ENGLISH_HORN: 'english-horn',
    CLARINET: 'clarinet',
    E_FLAT_CLARINET: 'e-flat-clarinet',
    BASS_CLARINET: 'bass-clarinet',
    BASSOON: 'bassoon',
    CONTRABASSOON: 'contrabassoon',
    RECORDER: 'recorder',
    SAXOPHONE: 'saxophone',
    /** バロック・古典期の横笛。モダン・フルート以前の楽曲解説に必須 */
    TRAVERSO: 'traverso',
    /** バセットホルンのような低域クラリネット。モーツァルトのレクイエム等で重要 */
    BASSET_HORN: 'basset-horn',
    /** A管、B♭管、C管などの区別を超えた、モーツァルト等の特定の指定用 */
    BASSET_CLARINET: 'basset-clarinet',
    /** オーボエより低く、イングリッシュホルンより高い。バッハの宗教曲で多用 */
    OBOE_D_AMORE: 'oboe-d-amore',
    /** バロック期の低音オーボエ。バッハのカンタータ等で頻出 */
    OBOE_DA_CACCIA: 'oboe-da-caccia',
    /** バロック期のオーボエ。モダン楽器と音色が大きく異なるため区別 */
    BAROQUE_OBOE: 'baroque-oboe',
    /** ヘッケルフォーン。R.シュトラウスやホルスト（惑星）で稀に使用される低音木管 */
    HECKELPHONE: 'heckelphone',

    // --- Brass (金管楽器) ---
    HORN: 'horn',
    WAGNER_TUBA: 'wagner-tuba',
    TRUMPET: 'trumpet',
    CORNET: 'cornet',
    TROMBONE: 'trombone',
    TUBA: 'tuba',
    EUPHONIUM: 'euphonium',
    /** バルブのない初期のトランペット。バロック音楽の輝かしい高音域の解説に必須 */
    NATURAL_TRUMPET: 'natural-trumpet',
    /** バルブのない初期のホルン。古典派までの「手（ゲシュトプフ）」による音程操作の解説に */
    NATURAL_HORN: 'natural-horn',
    /** バロック期の高音域専用トランペット。バッハのブランデンブルク協奏曲第2番などで使用 */
    PICCOLO_TRUMPET: 'piccolo-trumpet',
    /** トランペットより柔らかい音色を持つ。ブルックナーやマーラー等、ドイツ系作品で頻出 */
    FLUGELHORN: 'flugelhorn',
    /** ワーグナーの指環や、バロック・ルネサンスの古楽（サクバット）との区別として */
    BASS_TROMBONE: 'bass-trombone',
    /** ルネサンス〜バロック期の木製金管楽器。モンテヴェルディ等の初期バロック作品に必須 */
    ZINK: 'zink', // または CORNETTO
    /** 19世紀の金管楽器。ベルリオーズやメンデルスゾーンの初期スコアに登場（テューバの前身） */
    OPHICLEIDE: 'ophicleide',

    // --- Voice (声楽) ---
    SOPRANO: 'soprano',
    MEZZO_SOPRANO: 'mezzo-soprano',
    ALTO: 'alto',
    CONTRALTO: 'contralto',
    COUNTERTENOR: 'countertenor',
    TENOR: 'tenor',
    BARITONE: 'baritone',
    BASS: 'bass',
    /** 少年合唱やソロで用いられるボーイ・ソプラノ。フォーレのレクイエム等で重要 */
    BOY_SOPRANO: 'boy-soprano',
    /** バロック期までの去勢された男性ソプラノ・アルト。歴史的背景の解説に必須 */
    CASTRATO: 'castrato',
    /** 最低域のバス。ロシア正教の聖歌や、特定のオペラ役（サラストロ等）の分類に */
    BASS_PROFUNDO: 'bass-profundo',
    /** 混声合唱。第九やレクイエムなど、大規模な合唱作品のメタデータとして */
    CHOIR_MIXED: 'choir-mixed',
    /** 男声合唱。シューベルトの合唱曲やワーグナーのオペラ等 */
    CHOIR_MALE: 'choir-male',
    /** 女声合唱。メンデルスゾーンやブラームスの小品、宗教曲等 */
    CHOIR_FEMALE: 'choir-female',
    /** 児童合唱。マタイ受難曲やマーラーの交響曲（3番・8番）で必須 */
    CHOIR_CHILDREN: 'choir-children',

    // --- Percussion (打楽器) ---
    TIMPANI: 'timpani',
    GLOCKENSPIEL: 'glockenspiel',
    XYLOPHONE: 'xylophone',
    VIBRAPHONE: 'vibraphone',
    MARIMBA: 'marimba',
    SNARE_DRUM: 'snare-drum',
    BASS_DRUM: 'bass-drum',
    CYMBALS: 'cymbals',
    TRIANGLE: 'triangle',
    PERCUSSION_GENERAL: 'percussion-general',
    /** 鐘（の代用）。幻想交響曲、1812年、パルジファル等、宗教的・象徴的場面に必須 */
    TUBULAR_BELLS: 'tubular-bells',
    /** 銅鑼。悲愴、大地の歌、レクイエム等、死や運命を暗示する重要な音色 */
    TAM_TAM: 'tam-tam',
    /** くるみ割り人形、スペイン交響曲、カルメン等、民族的色彩の記述に必要 */
    CASTANETS: 'castanets',
    /** ルネサンス・バロック期の古いタンバリン。初期音楽の舞曲の解説に */
    TAMBOURINE: 'tambourine',
    /** 近現代作品（マーラー等）や特殊な編成で独立して指定される鍵盤打楽器 */
    XYLORIMBA: 'xylorimba',
    /** マーラーの交響曲第6番で使用される巨大な木槌。楽曲のアイデンティティそのもの */
    HAMMER: 'hammer',
    /** 魔法の笛やハイドンの軍隊、現代曲で使用される音程のない鈴の音 */
    BELLS: 'bells',

    // --- Plucked Strings (撥弦楽器) ---
    GUITAR: 'guitar',
    LUTE: 'lute',
    MANDOLIN: 'mandolin',
    HARP: 'harp',
    /** ネックが非常に長い大型リュート。バロック期の通奏低音（バッソ・コンティヌオ）の主力 */
    THEORBO: 'theorbo',
    /** バロック期のリュートより小型の撥弦楽器。バロック・ギター */
    BAROQUE_GUITAR: 'baroque-guitar',
    /** ギターの前身となったルネサンス期の楽器。スペイン音楽のルーツ解説に */
    VIHUELA: 'vihuela',
    /** 古代〜中世の竪琴。ギリシャ神話を題材にしたオペラや初期音楽の記述に */
    LYRE: 'lyre',
    /** ツィター。シュトラウスの『ウィーンの森の物語』などで象徴的に使用 */
    ZITHER: 'zither',
    /** ロシアの民族楽器だが、ストラヴィンスキーやプロコフィエフ等の作品で登場 */
    BALALAIKA: 'balalaika',

    // --- Others ---
    BASSO_CONTINUO: 'basso-continuo',
    ELECTRONICS: 'electronics',
} as const;

export type MusicalInstrument = (typeof MusicalInstrument)[keyof typeof MusicalInstrument];

export const MusicalInstrumentSchema = z.nativeEnum(MusicalInstrument);
