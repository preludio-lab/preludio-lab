import { MusicalExampleControl, MusicalExampleId } from './MusicalExampleControl';
import { MusicalExampleMetadata } from './MusicalExampleMetadata';
import { MusicalExampleBinding } from './MusicalExampleBinding';

export { type MusicalExampleId };

/**
 * 譜例ドメインエンティティ
 * 記事内で使用される譜例の抜粋と、録音ソースとの再生バインディングを表現します。
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
