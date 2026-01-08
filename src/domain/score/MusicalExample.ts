import { MusicalExampleControl, MusicalExampleId } from './MusicalExampleControl';
import { MusicalExampleMetadata } from './MusicalExampleMetadata';
import { MusicalExampleBinding } from './MusicalExampleBinding';

export { type MusicalExampleId };

/**
 * MusicalExample Domain Entity
 */
export interface MusicalExample {
    readonly control: MusicalExampleControl;
    readonly metadata: MusicalExampleMetadata;
    readonly binding: MusicalExampleBinding;
}

export const createMusicalExample = (
    control: MusicalExampleControl,
    metadata: MusicalExampleMetadata,
    binding: MusicalExampleBinding
): MusicalExample => ({
    control,
    metadata,
    binding,
});
