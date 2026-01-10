import { z } from '@/shared/validation/zod';

/**
 * Musical Place (音楽都市・場所)
 * 音楽史上の主要な都市や地域を定義。
 */
export const MusicalPlace = {
    // --- Germany / Austria ---
    VIENNA: 'vienna',
    BERLIN: 'berlin',
    LEIPZIG: 'leipzig',
    HAMBURG: 'hamburg',
    MUNICH: 'munich',
    SALZBURG: 'salzburg',
    BONN: 'bonn',
    EISENACH: 'eisenach',

    // --- France ---
    PARIS: 'paris',

    // --- UK ---
    LONDON: 'london',

    // --- Italy ---
    ROME: 'rome',
    VENICE: 'venice',
    MILAN: 'milan',
    NAPLES: 'naples',
    FLORENCE: 'florence',

    // --- Russia ---
    ST_PETERSBURG: 'st-petersburg',
    MOSCOW: 'moscow',

    // --- Poland ---
    WARSAW: 'warsaw',

    // --- Czech Republic ---
    PRAGUE: 'prague',
    BRNO: 'brno',

    // --- Hungary ---
    BUDAPEST: 'budapest',

    // --- USA ---
    NEW_YORK: 'new-york',
    BOSTON: 'boston',

    // --- Others ---
    ZURICH: 'zurich',
    AMSTERDAM: 'amsterdam',
    BRUSSELS: 'brussels',
    COPENHAGEN: 'copenhagen',
    STOCKHOLM: 'stockholm',
    TOKYO: 'tokyo',
} as const;

export type MusicalPlace = (typeof MusicalPlace)[keyof typeof MusicalPlace];

export const MusicalPlaceSchema = z.nativeEnum(MusicalPlace);
