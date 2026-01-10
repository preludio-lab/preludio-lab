import { z } from '@/shared/validation/zod';

/**
 * Musical Instrument (楽器)
 * Taxonomy準拠の楽器ID定義。
 * カテゴリ構造はコメントで表現し、値はフラットなEnumとして定義。
 */
export const MusicalInstrument = {
  // --- Keyboard (鍵盤楽器) ---
  /** ピアノ。鍵盤を叩くことでハンマーが弦を打つ現代の主要な鍵盤楽器 */
  PIANO: 'piano',
  /** オルガン。パイプまたは電子的に音を生成する、教会音楽やバロック期に不可欠な楽器 */
  ORGAN: 'organ',
  /** チェンバロ（ハープシコード）。弦を弾く（撥弦）構造を持つ、バロック期の中心的な鍵盤楽器 */
  HARPSICHORD: 'harpsichord',
  /** フォルテピアノ。18世紀後半から19世紀前半にかけてのピアノの初期形態 */
  FORTEPIANO: 'fortepiano',
  /** チェレスタ。金属板を叩くことで、鈴のように澄んだ音色を生成する鍵盤楽器 */
  CELESTA: 'celesta',
  /** クラヴィコード。小規模な室内用楽器で、繊細なニュアンス表現が可能な金属片で弦を叩く楽器 */
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
  /** ヴァイオリン。4本の弦を持つ、オーケストラや室内楽の花形楽器 */
  VIOLIN: 'violin',
  /** ヴィオラ。ヴァイオリンより一回り大きく、深みのある中音域を担う楽器 */
  VIOLA: 'viola',
  /** チェロ（セロ）。重厚な中低音域を担い、ソロや弦楽四重奏で重要な役割を果たす楽器 */
  CELLO: 'cello',
  /** コントラバス（ダブルベース）。弦楽器の中で最も低域を担当する、オーケストラの土台 */
  DOUBLE_BASS: 'double-bass',
  /** ヴィオラ・ダ・ガンバ。脚に挟んで弾く、バロック期以前のリュートに近い内部構造を持つ弦楽器 */
  VIOLA_DA_GAMBA: 'viola-da-gamba',
  /** ヴィオラ・ダモーレ。共鳴弦を持ち、甘く優雅な音色が特徴的なバロック期の楽器 */
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
  /** フルート。金属製または木製の横笛で、華やかで透明感のある高音域を担う楽器 */
  FLUTE: 'flute',
  /** ピッコロ。フルートの半分の長さで、オーケストラの最高音域を華やかに彩る楽器 */
  PICCOLO: 'piccolo',
  /** アルト・フルート。G管などで構成され、フルートより深く落ち着いた音色が特徴 */
  ALTO_FLUTE: 'alto-flute',
  /** オーボエ。2枚のリードを用いるダブルリード楽器で、哀愁を帯びた澄んだ音色が特徴 */
  OBOE: 'oboe',
  /** イングリッシュ・ホルン（コーラングレ）。オーボエより低く、より柔和でメランコリックな音色 */
  ENGLISH_HORN: 'english-horn',
  /** クラリネット。シングルリードを用いる楽器で、広い音域と豊かな表現力が特徴 */
  CLARINET: 'clarinet',
  /** 小クラリネット（変ホ管）。クラリネットより高く鋭い音域を持ち、ベルリオーズやマーラーで使用 */
  E_FLAT_CLARINET: 'e-flat-clarinet',
  /** バスクラリネット。クラリネットの低域版で、重厚で豊かな低音を提供する楽器 */
  BASS_CLARINET: 'bass-clarinet',
  /** ファゴット（バスーン）。2枚のリードを用いる低域木管楽器で、独特のユーモラスな音色も持つ */
  BASSOON: 'bassoon',
  /** コントラファゴット。ファゴットの1オクターブ下の低音を担当する、オーケストラの最低音域 */
  CONTRABASSOON: 'contrabassoon',
  /** リコーダー（タテブエ）。ルネサンスやバロック期に非常に一般的だった縦笛 */
  RECORDER: 'recorder',
  /** サクソフォン。金属製だがリードを用いる木管楽器。ラヴェルや近現代作品で多用 */
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
  /** ホルン（フレンチホルン）。カタツムリ状に巻かれた管を持ち、柔らかく荘厳な音色が特徴 */
  HORN: 'horn',
  /** ワーグナー・テューバ。ワーグナーが考案した、ホルン奏者が吹くことのできる特殊な金管楽器 */
  WAGNER_TUBA: 'wagner-tuba',
  /** トランペット。輝かしく直線的な音色を持ち、旋律の主役を担うことが多い楽器 */
  TRUMPET: 'trumpet',
  /** コルネット。トランペットに似ているが、より管が太く丸みのある柔らかい音色が特徴 */
  CORNET: 'cornet',
  /** トロンボーン。スライドを用いて音程を変える、力強くも荘厳な音色が特徴の楽器 */
  TROMBONE: 'trombone',
  /** テューバ。オーケストラや吹奏楽で最低音域の基礎を担う、巨大な金管楽器 */
  TUBA: 'tuba',
  /** ユーフォニアム。バリトン・ホルンに似た柔らかな音色を持ち、吹奏楽で主要な役割を果たす */
  EUPHONIUM: 'euphonium',
  /** バルブのない初期のトランペット。バロック音楽の輝かしい高音域の解説に必須 */
  NATURAL_TRUMPET: 'natural-trumpet',
  /** バルブのない初期のホルン。古典派までの「手（ゲシュトプフ）」による音程操作の解説に */
  NATURAL_HORN: 'natural-horn',
  /** バロック期の高音域専用トランペット。バッハのブランデンブルク協奏曲第2番などで使用 */
  PICCOLO_TRUMPET: 'piccolo-trumpet',
  /** トランペットより柔らかい音色を持つ。ブルックナーやマーラー等, ドイツ系作品で頻出 */
  FLUGELHORN: 'flugelhorn',
  /** ワーグナーの指環や、バロック・ルネサンスの古楽（サクバット）との区別として */
  BASS_TROMBONE: 'bass-trombone',
  /** ルネサンス〜バロック期の木製金管楽器。モンテヴェルディ等の初期バロック作品に必須 */
  ZINK: 'zink', // または CORNETTO
  /** 19世紀の金管楽器。ベルリオーズやメンデルスゾーンの初期スコアに登場（テューバの前身） */
  OPHICLEIDE: 'ophicleide',

  // --- Voice (声楽) ---
  /** ソプラノ。女声の最高域 */
  SOPRANO: 'soprano',
  /** メゾ・ソプラノ。ソプラノとアルトの間に位置する女声声域 */
  MEZZO_SOPRANO: 'mezzo-soprano',
  /** アルト。女声の低域（または少年合唱等の声域） */
  ALTO: 'alto',
  /** コントラルト。女性としては極めて低い、深みのある声域 */
  CONTRALTO: 'contralto',
  /** カウンターテナー。ファルセット（裏声）を用いて女声の音域を歌う男性声域 */
  COUNTERTENOR: 'countertenor',
  /** テノール（テナー）。男声の最高域 */
  TENOR: 'tenor',
  /** バリトン。テノールとバスの中間に位置する男声声域 */
  BARITONE: 'baritone',
  /** バス。男声の最低域 */
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
  /** ティンパニ。ピッチ調整が可能な太鼓で、オーケストラで最も重要な打楽器 */
  TIMPANI: 'timpani',
  /** グロッケンシュピール。金属製の鍵盤を叩く、キラキラとした高音の鍵盤打楽器 */
  GLOCKENSPIEL: 'glockenspiel',
  /** シロフォン（木琴）。木製の鍵盤を叩く、硬くはっきりした音色の鍵盤打楽器 */
  XYLOPHONE: 'xylophone',
  /** ヴィブラフォン。金属製の鍵盤と電動のファンを用い、余韻にビブラートを加える楽器 */
  VIBRAPHONE: 'vibraphone',
  /** マリンバ。シロフォンより大きく深く、豊かな共鳴筒を持つ鍵盤打楽器 */
  MARIMBA: 'marimba',
  /** スネアドラム（小太鼓）。裏側に響き線（スナッピー）を持ち、鋭い音が鳴る太鼓 */
  SNARE_DRUM: 'snare-drum',
  /** バスドラム（大太鼓）。最低域を担当する、オーケストラで最大の太鼓 */
  BASS_DRUM: 'bass-drum',
  /** シンバル。一対の金属板を打ち合わせるか、スティック等で鳴らす楽器 */
  CYMBALS: 'cymbals',
  /** トライアングル。三角形の金属棒を叩く、非常に高い浸透性のある音色が特徴 */
  TRIANGLE: 'triangle',
  /** 打楽器全般（個別の指定がない場合） */
  PERCUSSION_GENERAL: 'percussion-general',
  /** 鐘（の代用）。幻想交響曲、1812年、パルジファル等、宗教的・象徴的場面に必須 */
  TUBULAR_BELLS: 'tubular-bells',
  /** 銅鑼（タムタム）。死や運命を暗示する、重厚で強烈な音色の低域楽器 */
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
  /** ギター。6本の弦を持つ現代の主要な撥弦楽器。室内楽や独奏で活躍 */
  GUITAR: 'guitar',
  /** リュート。洋梨型の胴を持つ、ルネサンス・バロック期の中心的な撥弦楽器 */
  LUTE: 'lute',
  /** マンドリン。イタリア起源の小型の撥弦楽器。ヴィヴァルディの協奏曲などで有名 */
  MANDOLIN: 'mandolin',
  /** ハープ。大型の竪琴で、優雅なアルペジオやグリッサンドが特徴の楽器 */
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
  /** 通奏低音（楽器構成は文脈により変化する） */
  BASSO_CONTINUO: 'basso-continuo',
  /** 電子音響、シンセサイザーなどの電子的要素 */
  ELECTRONICS: 'electronics',
} as const;

export type MusicalInstrument = (typeof MusicalInstrument)[keyof typeof MusicalInstrument];

export const MusicalInstrumentSchema = z.nativeEnum(MusicalInstrument);
