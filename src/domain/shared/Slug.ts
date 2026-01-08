import { z } from 'zod';

/**
 * スラグのバリデーション用正規表現
 * - 英小文字、数字、ハイフンのみを許可
 * - 先頭と末尾にハイフンやスラッシュは禁止
 */
export const SLUG_FLAT_REGEX = /^[a-z0-9-]+$/;

/**
 * 階層構造（スラッシュ区切り）を許可するスラグの正規表現
 */
export const SLUG_HIERARCHICAL_REGEX = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

/**
 * スラグのバリデーションスキーマを作成する
 * @param maxLength 最大文字数 (デフォルト: 64)
 * @param allowHierarchical スラッシュによる階層構造を許可するか (デフォルト: true)
 */
export const createSlugSchema = (maxLength: number = 64, allowHierarchical: boolean = true) => {
    const regex = allowHierarchical ? SLUG_HIERARCHICAL_REGEX : SLUG_FLAT_REGEX;
    const message = allowHierarchical
        ? "Slug must be lowercase alphanumeric and hyphens, optionally separated by a single slash"
        : "Slug must be lowercase alphanumeric and hyphens only";

    return z.string()
        .min(1)
        .max(maxLength)
        .regex(regex, { message });
};

/**
 * デフォルトのスラグスキーマ（最大64文字、階層構造許可）
 */
export const SlugSchema = createSlugSchema(64, true);
