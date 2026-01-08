import { z } from 'zod';
import { MusicalExampleControlSchema } from './MusicalExampleControl';
import { MusicalExampleMetadataSchema } from './MusicalExampleMetadata';
import { MusicalExampleBindingSchema } from './MusicalExampleBinding';

/**
 * MusicalExample (Component/Excerpt)
 * 記事内に埋め込まれる譜例のルートエンティティ。
 */
export const MusicalExampleSchema = z.object({
    control: MusicalExampleControlSchema,
    metadata: MusicalExampleMetadataSchema,
    binding: MusicalExampleBindingSchema,
});

export type MusicalExample = z.infer<typeof MusicalExampleSchema>;
export { type MusicalExampleId } from './MusicalExampleControl';

/**
 * MusicalExample の生成
 */
export const createMusicalExample = (
    control: any,
    metadata: any,
    binding: any
): MusicalExample => {
    return MusicalExampleSchema.parse({
        control,
        metadata,
        binding,
    });
};
