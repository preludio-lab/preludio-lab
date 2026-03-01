import { z } from 'zod';
import { ComposerMetadataSchema } from '@/domain/composer/composer.metadata';
import { SlugSchema } from '@/domain/shared/common.metadata';
import { MasterSystemMetadataSchema } from '../../shared/master-data.schema';

/** 作曲家マスタースキーマの現在バージョン */
export const COMPOSER_MASTER_VERSION = '1.1.0';

/**
 * Composer Master Data Schema (JSON)
 * 作曲家マスタデータ(JSONファイル)の構造定義。
 *
 * アプリケーションの入力仕様（Command）に依存せず、
 * 純粋なドメインモデルである ComposerMetadataSchema に対して、
 * 永続化に必要な識別子（slug）とシステムメタデータを結合して定義します。
 */
export const ComposerMasterSchema = ComposerMetadataSchema.extend({
  /** 作曲家の一意な識別子 (URLセーフな文字列) */
  slug: SlugSchema,
})
  .merge(MasterSystemMetadataSchema)
  .extend({
    /**
     * スキーマバージョン (SemVer)
     * バリデーション時は古いバージョンも許容するため z.string() としますが、
     * 出力・デフォルト値として現在の最新バージョンを保持します。
     */
    _schemaVersion: z.string().default(COMPOSER_MASTER_VERSION),
  });

export type ComposerMaster = z.infer<typeof ComposerMasterSchema>;
