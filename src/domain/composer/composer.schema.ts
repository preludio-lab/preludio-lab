import { z } from 'zod';
import { ComposerControlSchema } from './composer.control';
import { ComposerMetadataSchema } from './composer.metadata';

/**
 * Composer Data Schema (Master JSON)
 * 作曲家マスタデータの構造定義 (Flat Structure for JSON)。
 *
 * - Control: ID/Slugなどの識別子
 * - Metadata: 名前、属性、プロフィールなどのドメインデータ
 *
 * これらをマージしてフラットなオブジェクトとして扱います。
 */
export const ComposerDataSchema = ComposerControlSchema.pick({
  slug: true,
}).merge(ComposerMetadataSchema);

export type ComposerData = z.infer<typeof ComposerDataSchema>;
