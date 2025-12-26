export const SITE_NAME = 'PreludioLab';
export const SITE_DESCRIPTION = 'Beyond Listening. Dive deeper into the classics.';
export const LOCALES = ['ja', 'en', 'es', 'de', 'zh', 'fr', 'it'] as const;
export type Locale = (typeof LOCALES)[number];

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://preludiolab.com';

/**
 * アプリケーション実行環境の定義
 */
export const APP_ENV = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production',
} as const;

export type AppEnv = (typeof APP_ENV)[keyof typeof APP_ENV];

/**
 * Node.js 標準の実行環境定義
 */
export const NODE_ENV = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production',
} as const;
