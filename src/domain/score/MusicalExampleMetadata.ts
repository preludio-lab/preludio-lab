import { z } from 'zod';
import { ScoreFormat } from './ScoreMetadata';

/**
 * 小節範囲の Zod スキーマ
 */
export const MeasureRangeSchema = z.object({
    /** 開始小節 (1以上, 9999以下) */
    startBar: z.number().int().min(1).max(9999),
    /** 終了小節 (1以上, 9999以下) */
    endBar: z.number().int().min(1).max(9999),
    /** 表示ラベル (例: "bars 1-8") */
    label: z.string().max(20).optional(),
});

export type MeasureRange = z.infer<typeof MeasureRangeSchema>;

/**
 * MusicalExampleMetadata の Zod スキーマ
 */
export const MusicalExampleMetadataSchema = z.object({
    /** 対象楽曲ID */
    workId: z.string().min(1).max(50),
    /** 出典エディションID (任意) */
    scoreId: z.string().max(50).optional(),
    /** URLスラグ / での階層化を許容 */
    slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/),
    /** データ形式 */
    format: z.nativeEnum(ScoreFormat),
    /** 楽譜データ本体 (ABC/MusicXML等, 最大100KB) */
    data: z.string().min(1).max(100000),
    /** 対象とする小節範囲 */
    measureRange: MeasureRangeSchema.optional(),
    /** キャプション (最大100) */
    caption: z.string().max(100).optional(),
    /** 詳細解説 (最大2000) */
    description: z.string().max(2000).optional(),
});

export type MusicalExampleMetadata = z.infer<typeof MusicalExampleMetadataSchema>;

/**
 * MusicalExampleMetadata の生成
 */
export const createMusicalExampleMetadata = (params: any): MusicalExampleMetadata => {
    return MusicalExampleMetadataSchema.parse(params);
};
