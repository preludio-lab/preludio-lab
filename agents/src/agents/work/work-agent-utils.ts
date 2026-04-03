import { type WorkDraft } from '@/schemas/work.js';

export const MULTI_MOVEMENT_GENRES = [
  'symphony',
  'concerto',
  'sonata',
  'suite',
  'mass',
  'opera',
  'oratorio',
  'string-quartet',
  'piano-trio',
  'trio-sonata',
  'divertimento',
  'serenade',
];

/**
 * 楽曲データの正規化（音楽学的な制約に基づくクリーンアップ）を行います。
 * WorkDraftAgent, WorkRefineAgent, および Workflow レイヤーで共有されます。
 */
export function normalizeWorkDraft<T extends WorkDraft>(data: T): T {
  const res = { ...data } as Record<string, unknown>;
  const genres = (res['genres'] as string[]) || [];
  const slug = (res['slug'] as string) || '';

  const isMultiMovement =
    genres.some((g: string) => MULTI_MOVEMENT_GENRES.includes(g)) ||
    slug.includes('concerto') ||
    slug.includes('symphony');

  if (isMultiMovement) {
    // 多楽章形式の場合、Workレベル（全体）での演奏情報は【原則禁止】
    delete res['tempo'];
    delete res['bpm'];
    delete res['timeSignature'];
    delete res['tempoTranslation'];
    delete res['metronomeUnit'];
  }

  // basedOn のクリーンアップ
  const basedOn = res['basedOn'] as Record<string, unknown> | undefined;
  if (basedOn) {
    const originalSlug = String(basedOn['originalWorkSlug'] || '').toLowerCase();
    if (!originalSlug || originalSlug === 'none' || originalSlug === 'null') {
      delete res['basedOn'];
    }
  }

  return res as T;
}
