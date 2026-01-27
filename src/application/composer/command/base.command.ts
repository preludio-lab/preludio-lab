import { ComposerMetadataSchema } from '@/domain/composer/composer.metadata';

/**
 * Composer Base Command Schema
 * Create/Update で共有される基本的なメタデータ定義。
 * ドメイン層の ComposerMetadataSchema をベースに、I/O要件に合わせて調整します。
 */
export const ComposerBaseCommandSchema = ComposerMetadataSchema;
