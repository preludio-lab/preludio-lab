import { z } from 'zod';
import { ComposerMasterSchema } from '@/application/composer/master/composer-master.schema.js';

/**
 * Draft phase specialized schema.
 * Fields with MultiLanguageString are simplified to single strings (Japanese)
 * to focus the model's attention.
 */
export const DraftFieldsSchema = z.object({
  fullName: z.string().describe('作曲家の氏名（日本語フルネーム）'),
  displayName: z.string().describe('作曲家の表示用氏名（日本語、名字のみ等）'),
  shortName: z.string().describe('作曲家の短縮名（日本語、姓のみ等）'),
  biography: z.string().describe('作曲家の人物紹介・略歴（日本語、500〜1000文字程度）').optional(),
});

export const ComposerDraftSchema = ComposerMasterSchema.omit({
  fullName: true,
  displayName: true,
  shortName: true,
  biography: true,
}).extend(DraftFieldsSchema.shape);

export type ComposerDraft = z.infer<typeof ComposerDraftSchema>;

/**
 * Translation step specialized schema.
 */
export const TranslationOutputSchema = z.object({
  fullName: z.string().describe('翻訳されたフルネーム'),
  displayName: z.string().describe('翻訳された表示名'),
  shortName: z.string().describe('翻訳された短縮名'),
  biography: z.string().describe('翻訳された人物紹介・略歴').optional(),
});

export type TranslationOutput = z.infer<typeof TranslationOutputSchema>;
