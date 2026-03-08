import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Logger インターフェース経由のログ出力を強制する。
      // console.logger.ts や CLI スクリプトなど、直接使用が必要な箇所は
      // eslint-disable-next-line no-console で個別に例外処理を行うこと。
      'no-console': 'error',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '**/.wrangler/**',
  ]),
]);

export default eslintConfig;
