export interface ComposerListDto {
  id: string;
  slug: string;
  name: string;
  era: string | null;
  worksCount: number;
}

export interface ComposerDetailDto {
  id: string;
  slug: string;
  name: string;
  biography: string | null;
  era: string | null;
  birthDate: string | null;
  deathDate: string | null;
  nationalityCode: string | null;
  // 多言語データ
  translations: Record<
    string,
    {
      fullName: string;
      displayName: string;
      shortName: string;
      biography: string | null;
    }
  >;
  // 関連作品プレビュー
  relatedWorks: Array<{
    id: string;
    title: string;
    year: number | null;
  }>;
  // オプティミスティックロック用
  updatedAt: string;
}

import { z } from 'zod';
import { ComposerMasterSchema } from '../master/composer-master.schema';

/**
 * Composer DTO
 * アプリケーション外部へ返す作曲家データの構造定義。
 */
export const ComposerDtoSchema = ComposerMasterSchema;

export type ComposerDto = z.infer<typeof ComposerDtoSchema>;
