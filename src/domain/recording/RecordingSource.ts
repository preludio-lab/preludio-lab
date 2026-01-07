import { z } from 'zod';
import { RecordingProvider, RecordingQuality } from './RecordingConstants';

/**
 * Recording Source
 * 録音の具体的な提供元 (YouTube, Spotify等)
 */
export const RecordingSourceSchema = z.object({
    /** ソースのユニークID (UUID v7) */
    id: z.string().min(1).max(50),
    /** プロバイダ (Enum) */
    provider: z.nativeEnum(RecordingProvider),
    /** 外部サービスのIDまたはURL (最大2048文字) */
    externalSourceId: z.string().min(1).max(2048),
    /** 品質 (Optional) */
    quality: z.nativeEnum(RecordingQuality).optional(),
});

export type RecordingSource = z.infer<typeof RecordingSourceSchema>;
