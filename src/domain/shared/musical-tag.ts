import { z } from '@/shared/validation/zod';

/**
 * Musical Tag (楽曲タグ)
 * Taxonomy準拠のタグID定義。
 * カテゴリ構造（Mood, Situation, Terminology, Duration, Occasion, Pedagogy, Heritage/Media）
 * を反映したフラットなEnumとして定義。
 */
export const MusicalTag = {
  // --- Mood (情緒・雰囲気) ---
  JOYFUL: 'joyful',
  PASSIONATE: 'passionate',
  BRILLIANT: 'brilliant',
  DRAMATIC: 'dramatic',
  SERENE: 'serene',
  HEALING: 'healing',
  SPIRITUAL: 'spiritual',
  ETHEREAL: 'ethereal',
  ELEGANT: 'elegant',
  MAJESTIC: 'majestic',
  PASTORAL: 'pastoral',
  NOSTALGIC: 'nostalgic',
  MELANCHOLIC: 'melancholic',
  GLOOMY: 'gloomy',
  TRAGIC: 'tragic',
  TENSE: 'tense',
  PLAYFUL: 'playful',
  IRONIC: 'ironic',
  AUSTERE: 'austere',
  GROTESQUE: 'grotesque',

  // --- Situation (利用シーン・文脈) ---
  MORNING: 'morning',
  AFTERNOON_TEA: 'afternoon-tea',
  SUNSET_EVENING: 'sunset-evening',
  NIGHT: 'night',
  SUNDAY_AFTERNOON: 'sunday-afternoon',
  DEEP_FOCUS: 'deep-focus',
  STUDY_EXAM: 'study-exam',
  READING: 'reading',
  ARTISTIC_CREATION: 'artistic-creation',
  RELAX: 'relax',
  SLEEP: 'sleep',
  MEDITATION: 'meditation',
  YOGA_STRETCHING: 'yoga-stretching',
  BEAUTY_SELFCARE: 'beauty-selfcare',
  MENTAL_REFRESH: 'mental-refresh',
  DINNER_PARTY: 'dinner-party',
  WINE_PAIRING: 'wine-pairing',
  COFFEE_BREAK: 'coffee-break',
  DRIVING_ROADTRIP: 'driving-roadtrip',
  PARENTING_KIDS: 'parenting-kids',
  MATERNITY_CLASSIC: 'maternity-classic',
  RAINY_DAY: 'rainy-day',
  ENERGETIC_START: 'energetic-start',
  ROMANCE: 'romance', // Note: also exists in categories, but used as situation/tag here
  AUTUMN_EVENING: 'autumn-evening',
  WINTER_FIREPLACE: 'winter-fireplace',

  // --- Terminology (音楽用語・キーワード) ---
  VIRTUOSO: 'virtuoso',
  PERIOD_INSTRUMENT: 'period-instrument',
  TRANSCRIPTION: 'transcription',
  PIZZICATO: 'pizzicato',
  PREMIERE_SCANDAL: 'premiere-scandal',
  DEDICATION_LOVE: 'dedication-love',
  THEMATIC_CATALOGUE: 'thematic-catalogue',
  UNFINISHED_BEAUTY: 'unfinished-beauty',
  REDISCOVERED: 'rediscovered',
  POSTHUMOUS_WORK: 'posthumous-work',
  POLITICAL_INFLUENCE: 'political-influence',
  MINIMALISM: 'minimalism',
  NATIONAL_STYLE: 'national-style',
  NATURE_DEPICTION: 'nature-depiction',
  LITERARY_INSPIRED: 'literary-inspired',
  AVANT_GARDE: 'avant-garde',
  ACCESSIBLE_CLASSICS: 'accessible-classics',
  STANDARD_REPERTOIRE: 'standard-repertoire',
  NICKNAMED_WORK: 'nicknamed-work',
  HIDDEN_GEM: 'hidden-gem',
  MANUSCRIPT_URTEXT: 'manuscript-urtext',
  CYCLIC_THEME: 'cyclic-theme',
  VIENNESE_CLASSICISM: 'viennese-classicism',
  SECOND_VIENNESE_SCHOOL: 'second-viennese-school',
  FRANCO_BELGIAN_SCHOOL: 'franco-belgian-school',
  MIGHTY_HANDFUL: 'mighty-handful',
  LES_SIX: 'les-six',

  // --- Duration (演奏時間・規模) ---
  SHORT_PIECE: 'short-piece',
  MID_LENGTH: 'mid-length',
  MONUMENTAL_WORK: 'monumental-work',
  MINIATURE: 'miniature',

  // --- Occasion (行事・季節) ---
  SEASONAL_SPRING: 'seasonal-spring',
  SEASONAL_SUMMER: 'seasonal-summer',
  SEASONAL_AUTUMN: 'seasonal-autumn',
  SEASONAL_WINTER: 'seasonal-winter',
  CHRISTMAS: 'christmas',
  NEW_YEAR_CELEBRATION: 'new-year-celebration',
  EASTER_PASSION: 'easter-passion',
  HALLOWEEN_SPOOKY: 'halloween-spooky',
  WEDDING_CELEBRATION: 'wedding-celebration',
  MEMORIAL_SOLEMN: 'memorial-solemn',
  GRADUATION_DEPARTURE: 'graduation-departure',
  BIRTH_ANNIVERSARY: 'birthday-anniversary',

  // --- Pedagogy (教育・分析) ---
  ANALYSIS_FOCUS: 'analysis-focus',
  COUNTERPOINT_MASTERY: 'counterpoint-mastery',
  HARMONIC_INNOVATION: 'harmonic-innovation',
  ORCHESTRATION_GEM: 'orchestration-gem',
  PIANO_TECHNIQUE_EXT: 'piano-technique-ext',
  IDIOMATIC_WRITING: 'idiomatic-writing',
  CHAMBER_INTERACTION: 'chamber-interaction',
  HISTORICAL_PERFORMANCE: 'historical-performance',
  VOCAL_DICTION_PHRASING: 'vocal-diction-phrasing',

  // --- Heritage & Media (文化・メディア) ---
  FEATURED_IN_CINEMA: 'featured-in-cinema',
  ANIME_MANGA_CLASSIC: 'anime-manga-classic',
  VIDEO_GAME_CONNECTION: 'video-game-connection',
  POP_MUSIC_SAMPLING: 'pop-music-sampling',
  FAMOUS_TV_COMMERCIAL: 'famous-tv-commercial',
  LITERARY_CONNECTION: 'literary-connection',
  VISUAL_ARTS_LINK: 'visual-arts-link',
  HISTORICAL_EVENT: 'historical-event',
  CITY_GEOGRAPHIC_TRIBUTE: 'city-geographic-tribute',
} as const;

export type MusicalTag = (typeof MusicalTag)[keyof typeof MusicalTag];

export const MusicalTagSchema = z.nativeEnum(MusicalTag);
