import { z } from 'zod';
import { CreateComposerCommandSchema } from '../command/create-composer.command';
import { MasterSystemMetadataSchema } from '../../shared/master-data.schema';

/**
 * Composer Master Data Schema (JSON)
 * 作曲家マスタデータ(JSONファイル)の構造定義。
 *
 * Approach B: アプリケーション層の CreateComposerCommand をベースに、
 * マスタ管理用のシステムメタデータを付与して定義します。
 */
export const ComposerMasterSchema = CreateComposerCommandSchema.merge(MasterSystemMetadataSchema);

export type ComposerMaster = z.infer<typeof ComposerMasterSchema>;

/**
 * Legacy support for migration
 * TODO: Replace all references to ComposerData with ComposerMaster
 */
export type ComposerData = ComposerMaster;
