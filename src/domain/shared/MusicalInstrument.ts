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

    // --- Strings (弦楽器) ---
    VIOLIN: 'violin',
    VIOLA: 'viola',
    CELLO: 'cello',
    DOUBLE_BASS: 'double-bass',
    VIOLA_DA_GAMBA: 'viola-da-gamba',
    VIOLA_D_AMORE: 'viola-d-amore',

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

    // --- Brass (金管楽器) ---
    HORN: 'horn',
    WAGNER_TUBA: 'wagner-tuba',
    TRUMPET: 'trumpet',
    CORNET: 'cornet',
    TROMBONE: 'trombone',
    TUBA: 'tuba',
    EUPHONIUM: 'euphonium',

    // --- Voice (声楽) ---
    SOPRANO: 'soprano',
    MEZZO_SOPRANO: 'mezzo-soprano',
    ALTO: 'alto',
    CONTRALTO: 'contralto',
    COUNTERTENOR: 'countertenor',
    TENOR: 'tenor',
    BARITONE: 'baritone',
    BASS: 'bass',

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

    // --- Plucked Strings (撥弦楽器) ---
    GUITAR: 'guitar',
    LUTE: 'lute',
    MANDOLIN: 'mandolin',
    HARP: 'harp',

    // --- Others ---
    BASSO_CONTINUO: 'basso-continuo',
    ELECTRONICS: 'electronics',
} as const;

export type MusicalInstrument = (typeof MusicalInstrument)[keyof typeof MusicalInstrument];

export const MusicalInstrumentSchema = z.nativeEnum(MusicalInstrument);
