import { z } from 'zod';

/**
 * 楽譜原本のソースプロバイダ
 */
export const ScoreSourceProvider = {
  GITHUB: 'github',
  R2: 'r2',
} as const;

export type ScoreSourceProvider = (typeof ScoreSourceProvider)[keyof typeof ScoreSourceProvider];

/**
 * 楽譜データ形式
 */
export const ScoreSourceFormat = {
  KERN: 'kern',
  MUSICXML: 'musicxml',
  MEI: 'mei',
  MXL: 'mxl',
} as const;

export type ScoreSourceFormat = (typeof ScoreSourceFormat)[keyof typeof ScoreSourceFormat];

/**
 * ScoreSource Entity
 * 楽譜の原本（RAWデータ）の所在を特定するためのエンティティ。
 * 決定論的取得（不変のコミットハッシュ等）を前提とする。
 */
export const ScoreSourceSchema = z.object({
  id: z.string().uuid(),
  workId: z.string().uuid(),
  workPartId: z.string().uuid().optional(),
  scoreId: z.string().uuid().optional(),
  provider: z.nativeEnum(ScoreSourceProvider),
  // GitHub 詳細
  repositoryOwner: z.string().optional(),
  repositoryName: z.string().optional(),
  commitHash: z.string().length(40),
  filePath: z.string(),
  format: z.nativeEnum(ScoreSourceFormat),
  // 譜面上の楽章情報
  workPartNumber: z.number().int().nonnegative(),
  workPartTitle: z.string().optional(),
  workPartSlug: z.string(),
  license: z.string().optional(),
});

export type ScoreSource = z.infer<typeof ScoreSourceSchema>;
