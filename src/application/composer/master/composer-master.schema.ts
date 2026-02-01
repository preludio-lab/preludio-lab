import { z } from 'zod';
import { CreateComposerCommandSchema } from '../command/create-composer.command';
import { MasterSystemMetadataSchema } from '../../shared/master-data.schema';

/** 作曲家マスタースキーマの現在バージョン */
export const COMPOSER_MASTER_VERSION = '1.1.0';

/**
 * Composer Master Data Schema (JSON)
 * 作曲家マスタデータ(JSONファイル)の構造定義。
 *
 * Approach B: アプリケーション層の CreateComposerCommand をベースに、
 * マスタ管理用のシステムメタデータを付与して定義します。
 */
export const ComposerMasterSchema = CreateComposerCommandSchema.merge(
  MasterSystemMetadataSchema,
).extend({
  /**
   * スキーマバージョン (SemVer)
   * バリデーション時は古いバージョンも許容するため z.string() としますが、
   * 出力・デフォルト値として現在の最新バージョンを保持します。
   */
  _schemaVersion: z.string().default(COMPOSER_MASTER_VERSION),
});

export type ComposerMaster = z.infer<typeof ComposerMasterSchema>;
