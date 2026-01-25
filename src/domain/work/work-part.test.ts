import { describe, it, expect } from 'vitest';
import { WorkPart, WorkPartId } from './work-part';
import { WorkPartControl, WorkPartControlSchema } from './work-part.control';
import { WorkId } from './work';
import { WorkPartMetadata } from './work-part.metadata';
import { MusicalGenre } from '../shared/musical-genre';

describe('WorkPart Entity', () => {
  const control: WorkPartControl = {
    id: '550e8400-e29b-41d4-a716-446655440001' as WorkPartId,
    workId: '550e8400-e29b-41d4-a716-446655440000' as WorkId,
    slug: '1st-mov',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const metadata: WorkPartMetadata = {
    titleComponents: {
      title: { ja: '第1楽章', en: '1st Movement' },
    },
    type: 'movement',
    isNameStandard: true,
    musicalIdentity: {
      genres: [MusicalGenre.FORM.SONATA_FORM],
      tempo: 'Allegro con brio',
    },
    nicknames: [],
    catalogues: [],
  };

  it('should initialize with control and metadata', () => {
    const part = new WorkPart(control, metadata);
    expect(part.id).toBe(control.id);
    expect(part.workId).toBe(control.workId);
    expect(part.slug).toBe(control.slug);
    expect(part.order).toBe(control.order);
    expect(part.title.ja).toBe(metadata.titleComponents.title.ja);
    expect(part.type).toBe(metadata.type);
    expect(part.isNameStandard).toBe(metadata.isNameStandard);
    expect(part.musicalIdentity?.tempo).toBe(metadata.musicalIdentity?.tempo);
  });

  it('should clone with new attributes', () => {
    const part = new WorkPart(control, metadata);
    const cloned = part.cloneWith({
      control: { order: 2 },
      metadata: { description: { ja: '説明' } },
    });

    expect(cloned.order).toBe(2);
    expect(cloned.description?.ja).toBe('説明');
    expect(cloned.id).toBe(control.id); // Identity preserved
    expect(cloned.title.ja).toBe(metadata.titleComponents.title.ja); // Other metadata preserved
  });

  it('should fail validation if order exceeds 100', () => {
    const invalidControl = { ...control, order: 101 };
    // Note: WorkPart entity constructor does not run Zod validation by default currently,
    // but WorkPartControlSchema should be used for validation before creation in application layer.
    // Here we test the schema directly for verification.
    const result = WorkPartControlSchema.safeParse(invalidControl);
    expect(result.success).toBe(false);
  });
});
