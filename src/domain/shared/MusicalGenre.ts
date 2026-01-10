import { z } from '@/shared/validation/zod';

/**
 * Musical Genre & Form (ジャンル・形式)
 * Taxonomy準拠の構造化されたジャンル定義。
 */
export const MusicalGenre = {
    /** 1. 管弦楽曲 (Orchestral) */
    ORCHESTRAL: {
        /** 交響曲 (Symphony) */
        SYMPHONY: 'symphony',
        /** 序曲・前奏曲 (Overture / Prelude) */
        OVERTURE: 'overture',
        /** 交響詩 (Tone Poem) */
        TONE_POEM: 'tone-poem',
        /** 管弦楽組曲 (Orchestral Suite) */
        SUITE_ORCH: 'suite-orch',
        /** セレナード・ディヴェルティメント (Serenade / Divertimento) */
        SERENADE_DIVERTIMENTO: 'serenade-divertimento',
        /** 劇付随音楽 (Incidental Music) */
        INCIDENTAL_MUSIC: 'incidental-music',
    },

    /** 2. 舞台音楽 (Stage Music) */
    STAGE: {
        /** オペラ (Opera) */
        OPERA: 'opera',
        /** オペレッタ (Operetta) */
        OPERETTA: 'operetta',
        /** バレエ音楽 (Ballet Music) */
        BALLET: 'ballet',
    },

    /** 3. 協奏曲 (Concerto) */
    CONCERTO: {
        /** ピアノ協奏曲 (Piano Concerto) */
        PIANO_CONCERTO: 'piano-concerto',
        /** ヴァイオリン協奏曲 (Violin Concerto) */
        VIOLIN_CONCERTO: 'violin-concerto',
        /** チェロ協奏曲 (Cello Concerto) */
        CELLO_CONCERTO: 'cello-concerto',
        /** 管楽器のための協奏曲 (Wind Concerto) */
        WIND_CONCERTO: 'wind-concerto',
        /** 合奏協奏曲（コンチェルト・グロッソ） (Concerto Grosso) */
        CONCERTO_GROSSO: 'concerto-grosso',
        /** 協奏的楽曲（変奏曲形式の協奏曲等） (Concerted Work) */
        CONCERTED_WORK: 'concerted-work',
    },

    /** 4. 室内楽曲 (Chamber Music) */
    CHAMBER: {
        /** 弦楽重奏 (String Ensemble) */
        CHAMBER_STRINGS: 'chamber-strings',
        /** ピアノ重奏 (Piano Ensemble) */
        CHAMBER_PIANO: 'chamber-piano',
        /** 独奏ソナタ（伴奏付） (Instrumental Sonata (with Piano)) */
        SONATA_DUO: 'sonata-duo',
        /** 鍵盤アンサンブル（連弾・2台ピアノ） (Keyboard Ensemble (4-hands / 2 Pianos)) */
        KEYBOARD_ENSEMBLE: 'keyboard-ensemble',
        /** 管楽アンサンブル（木管五重奏等） (Wind Ensemble) */
        CHAMBER_WIND: 'chamber-wind',
        /** 混合・その他アンサンブル (Mixed / Other Ensemble) */
        CHAMBER_MIXED: 'chamber-mixed',
    },

    /** 5. 独奏曲 (Solo Music) */
    SOLO: {
        /** 鍵盤独奏 (Keyboard Solo) */
        KEYBOARD_SOLO: 'keyboard-solo',
        /** 弦楽器独奏 (String Solo) */
        STRING_SOLO: 'string-solo',
        /** 管楽器独奏 (Wind Solo) */
        WIND_SOLO: 'wind-solo',
        /** その他独奏 (Other Instrumental Solo) */
        SOLO_OTHER_INST: 'solo-other-inst',
    },

    /** 6. 声楽・合唱曲 (Vocal / Choral) */
    VOCAL_CHORAL: {
        /** 歌曲 (Art Song / Lied) */
        LIED: 'lied',
        /** 連作歌曲 (Song Cycle) */
        SONG_CYCLE: 'song-cycle',
        /** ミサ曲・レクイエム (Mass / Requiem) */
        MASS_REQUIEM: 'mass-requiem',
        /** オラトリオ・受難曲 (Oratorio / Passion) */
        ORATORIO_PASSION: 'oratorio-passion',
        /** カンタータ (Cantata) */
        CANTATA: 'cantata',
        /** 古楽声楽曲（マドリガル、モテット、グレゴリオ聖歌等） (Early Vocal Music) */
        EARLY_VOCAL: 'early-vocal',
        /** その他合唱曲 (Other Choral Works) */
        CHORAL_OTHERS: 'choral-others',
    },

    /** 7. 楽曲形式 (Musical Form) */
    FORM: {
        /** ソナタ（多楽章構成） (Sonata (Multi-movement)) */
        SONATA: 'sonata',
        /** ソナタ形式 (Sonata Form) */
        SONATA_FORM: 'sonata-form',
        /** 変奏曲 (Variations) */
        VARIATIONS: 'variations',
        /** フーガ・対位法 (Fugue / Counterpoint) */
        FUGUE_COUNTERPOINT: 'fugue-counterpoint',
        /** 組曲・パルティータ (Suite / Partita) */
        SUITE_PARTITA: 'suite-partita',
        /** ロンド (Rondo) */
        RONDO: 'rondo',
        /** 三部形式 (Ternary Form) */
        TERNARY_FORM: 'ternary-form',
        /** 二部形式 (Binary Form) */
        BINARY_FORM: 'binary-form',
        /** 循環形式 (Cyclic Form) */
        CYCLIC_FORM: 'cyclic-form',
        /** アリア（詠唱） (Aria / Air) */
        ARIA: 'aria',
        /** レチタティーヴォ（叙唱） (Recitative) */
        RECITATIVE: 'recitative',
        /** 重唱（アンサンブル） (Vocal Ensemble) */
        VOCAL_ENSEMBLE: 'vocal-ensemble',
        /** 合唱曲 (Chorus) */
        CHORUS_PIECE: 'chorus-piece',
        /** ミサ通常文 (Ordinary of the Mass) */
        MASS_ORDINARY: 'mass-ordinary',
        /** レクイエム (Requiem) */
        REQUIEM_FORM: 'requiem-form',
        /** 受難曲構造 (Passion) */
        PASSION_STRUCTURE: 'passion-structure',
        /** コラール (Chorale) */
        CHORALE: 'chorale',
        /** モテット (Motet) */
        MOTET: 'motet',
        /** マドリガル (Madrigal) */
        MADRIGAL: 'madrigal',
        /** 歌曲・リート (Lied / Art Song) */
        LIED_SONG: 'lied-song',
        /** 連作歌曲（歌曲集） (Song Cycle) */
        SONG_CYCLE_STRUCTURE: 'song-cycle-structure',
        /** 有節形式 (Strophic Form) */
        STROPHIC: 'strophic',
        /** 通奏形式 (Through-composed) */
        THROUGH_COMPOSED: 'through-composed',
        /** ヴォカリーズ (Vocalise) */
        VOCALISE: 'vocalise',
        /** 前奏曲 (Prelude) */
        PRELUDE: 'prelude',
        /** 夜想曲（ノクターン） (Nocturne) */
        NOCTURNE: 'nocturne',
        /** 即興曲（アンプロンプチュ） (Impromptu) */
        IMPROMPTU: 'impromptu',
        /** スケルツォ (Scherzo) */
        SCHERZO: 'scherzo',
        /** バラード（叙事詩） (Ballade) */
        BALLADE: 'ballade',
        /** 幻想曲（ファンタジア） (Fantasia) */
        FANTASIA: 'fantasia',
        /** 間奏曲 (Intermezzo) */
        INTERMEZZO: 'intermezzo',
        /** バガテル (Bagatelle) */
        BAGATELLE: 'bagatelle',
        /** ユモレスク (Humoresque) */
        HUMORESQUE: 'humoresque',
        /** ロマンス (Romance) */
        ROMANCE: 'romance',
        /** アラベスク (Arabesque) */
        ARABESQUE: 'arabesque',
        /** 舟歌・子守歌 (Barcarolle / Berceuse) */
        BARCAROLLE_BERCEUSE: 'barcarolle-berceuse',
        /** 悲歌（エレジー） (Elegy) */
        ELEGY: 'elegy',
        /** 練習曲（エチュード） (Étude) */
        ETUDE: 'etude',
        /** トッカータ (Toccata) */
        TOCCATA: 'toccata',
        /** 奇想曲（カプリッチョ） (Caprice / Capriccio) */
        CAPRICE_CAPRICCIO: 'caprice-capriccio',
        /** 狂詩曲（ラプソディ） (Rhapsody) */
        RHAPSODY: 'rhapsody',
        /** パラフレーズ・編曲 (Transcription / Paraphrase) */
        TRANSCRIPTION_PARAPHRASE: 'transcription-paraphrase',
        /** 演奏会用楽曲 (Concert Piece / Konzertstück) */
        CONCERT_PIECE: 'concert-piece',
        /** カデンツァ (Cadenza) */
        CADENZA: 'cadenza',
        /** 華麗なる様式 (Style Brillant) */
        STYLE_BRILLANT: 'style-brillant',
        /** アルマンド (Allemande) */
        ALLEMANDE: 'allemande',
        /** クーラント (Courante) */
        COURANTE: 'courante',
        /** サラバンド (Sarabande) */
        SARABANDE: 'sarabande',
        /** ジーグ (Gigue) */
        GIGUE: 'gigue',
        /** ガヴォット (Gavotte) */
        GAVOTTE: 'gavotte',
        /** ブーレ (Bourrée) */
        BOURREE: 'bourree',
        /** パスピエ (Passepied) */
        PASSEPIED: 'passepied',
        /** メヌエット (Minuet) */
        MINUET: 'minuet',
        /** ワルツ（円舞曲） (Waltz) */
        WALTZ: 'waltz',
        /** ポロネーズ (Polonaise) */
        POLONAISE: 'polonaise',
        /** マズルカ (Mazurka) */
        MAZURKA: 'mazurka',
        /** 行進曲 (March) */
        MARCH: 'march',
        /** タランテラ (Tarantella) */
        TARANTELLA: 'tarantella',
        /** ボレロ・ハバネラ (Bolero / Habanera) */
        BOLERO_HABANERA: 'bolero-habanera',
        /** チャールダーシュ (Czardas) */
        CZARDAS: 'czardas',
        /** ポルカ (Polka) */
        POLKA: 'polka',
        /** ギャロップ (Galop) */
        GALOP: 'galop',
        /** パヴァーヌ・ガリアルド (Pavane / Galliard) */
        PAVANE_GALLIARD: 'pavane-galliard',
        /** パッサカリア (Passacaglia) */
        PASSACAGLIA: 'passacaglia',
        /** シャコンヌ (Chaconne) */
        CHACONNE: 'chaconne',
        /** 固執低音（グラウンド） (Basso Ostinato / Ground) */
        BASSO_OSTINATO: 'basso-ostinato',
        /** フォリア (Folía) */
        FOLIA: 'folia',
        /** 交響詩的構造 (Symphonic Poem Structure) */
        SYMPHONIC_POEM_STRUCTURE: 'symphonic-poem-structure',
        /** 標題交響曲形式 (Program Symphony Form) */
        PROGRAM_SYMPHONY_FORM: 'program-symphony-form',
        /** ライトモティーフ体系 (Leitmotif System) */
        LEITMOTIF_SYSTEM: 'leitmotif-system',
        /** 固定観念（イデー・フィクス） (Idée fixe) */
        IDEE_FIXE: 'idee-fixe',
        /** メロドラマ (Mélodrame) */
        MELODRAME: 'melodrame',
        /** 語画法（マドリガリズム） (Word Painting) */
        WORD_PAINTING: 'word-painting',
    },
} as const;

export type MusicalGenre =
    (typeof MusicalGenre)[keyof typeof MusicalGenre][keyof (typeof MusicalGenre)[keyof typeof MusicalGenre]];

// フラットなIDリストを抽出
const allGenres = Object.values(MusicalGenre).flatMap((category) => Object.values(category)) as [
    string,
    ...string[],
];

export const MusicalGenreSchema = z.enum(allGenres);
