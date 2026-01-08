import { z } from 'zod';

/**
 * アフィリエイトリンクの Zod スキーマ
 * 複数のドメイン（Article, Score等）で共有されます。
 */
export const AffiliateLinkSchema = z.object({
    /** 提供者名 (amazon, apple, spotify, henle等) */
    provider: z.string().min(1).max(50),
    /** URL */
    url: z.string().url().max(2048),
    /** ボタン等に表示するラベル (任意) */
    label: z.string().max(20).optional(),
});

export type AffiliateLink = z.infer<typeof AffiliateLinkSchema>;
