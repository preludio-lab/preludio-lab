import { describe, expect, it } from 'vitest';
import { WorkDetailDtoSchema, WorkPartDetailDtoSchema } from './work-detail.dto';

const createValidTranslation = () => ({
  title: 'Symphony No. 5 in C minor, Op. 67',
  titlePrefix: 'Symphony No. 5',
  titleContent: 'in C minor',
  titleNickname: 'Fate',
  description: 'A famous symphony.',
  nicknames: ['Schicksalssinfonie'],
  compositionPeriod: 'Middle period',
});

const createValidPartTranslation = () => ({
  title: '1st Movement: Allegro con brio',
  titlePrefix: '1st Movement',
  titleContent: 'Allegro con brio',
  titleNickname: null,
  tempoTranslation: null,
  description: null,
});

const createValidPart = (overrides = {}) => ({
  id: '11111111-1111-1111-1111-111111111111',
  slug: '1st-mov',
  sortOrder: 1,
  type: 'movement',
  isNameStandard: true,
  catalogues: [],
  keyTonality: 'c-minor',
  tempoText: 'Allegro con brio',
  tsNumerator: 2,
  tsDenominator: 4,
  tsDisplayString: '2/4',
  bpm: 108,
  metronomeUnit: 'quarter',
  impressionDimensions: null,
  genres: ['symphony'],
  instruments: ['piano'],
  nicknames: [],
  performanceDifficulty: 3,
  translations: { ja: createValidPartTranslation() },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const createValidWork = (overrides = {}) => ({
  id: '00000000-0000-0000-0000-000000000001',
  composerId: '00000000-0000-0000-0000-000000000002',
  composerSlug: 'beethoven',
  composerName: 'Beethoven',
  slug: 'symphony-no5',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  era: 'early-romantic',
  instrumentation: '2.2.2.2 - 4.2.3.0 - tmp - str',
  performanceDifficulty: 4,
  compositionYear: 1808,
  keyTonality: 'c-minor',
  tempoText: 'Allegro con brio',
  tsNumerator: 2,
  tsDenominator: 4,
  tsDisplayString: '2/4',
  bpm: 108,
  metronomeUnit: 'quarter',
  impressionDimensions: { innovation: 5, scale: 9 },
  instrumentationFlags: { isOrchestral: true },
  catalogues: [{ prefix: 'op', number: '67', isPrimary: true }],
  genres: ['symphony'],
  tags: ['classicist'],
  instruments: ['piano'],
  translations: { ja: createValidTranslation() },
  parts: [createValidPart()],
  ...overrides,
});

describe('WorkDetailDtoSchema', () => {
  it('should parse valid data', () => {
    const result = WorkDetailDtoSchema.safeParse(createValidWork());
    expect(result.success).toBe(true);
  });

  it('should fail with extra fields (strict mode)', () => {
    const data = {
      ...createValidWork(),
      secretField: 'should-not-leak',
    };
    const result = WorkDetailDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue.code).toBe('unrecognized_keys');
      if (issue.code === 'unrecognized_keys') {
        expect(issue.keys).toContain('secretField');
      }
    }
  });

  it('should fail when required id is missing', () => {
    const data = createValidWork();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (data as any).id;
    const result = WorkDetailDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should accept multiple supported languages in translations', () => {
    const data = createValidWork({
      translations: {
        ja: createValidTranslation(),
        en: createValidTranslation(),
        de: createValidTranslation(),
      },
    });
    const result = WorkDetailDtoSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject unsupported language keys in translations', () => {
    const data = createValidWork({
      translations: {
        ja: createValidTranslation(),
        kr: createValidTranslation(), // Not supported
      },
    });
    const result = WorkDetailDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should accept empty parts array', () => {
    const data = createValidWork({ parts: [] });
    const result = WorkDetailDtoSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('WorkPartDetailDtoSchema', () => {
  it('should parse valid part data', () => {
    const result = WorkPartDetailDtoSchema.safeParse(createValidPart());
    expect(result.success).toBe(true);
  });

  it('should fail with extra fields in part (strict mode)', () => {
    const data = {
      ...createValidPart(),
      extraField: 'not-allowed',
    };
    const result = WorkPartDetailDtoSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue.code).toBe('unrecognized_keys');
    }
  });
});
