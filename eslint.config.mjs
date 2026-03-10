import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.name=/(serverLogger|clientLogger|cliLogger)/], Identifier[name=/(serverLogger|clientLogger|cliLogger)/][parent.type!='ImportSpecifier'][parent.type!='ImportDefaultSpecifier'][parent.type!='VariableDeclarator']",
          message:
            "Do not use 'serverLogger', 'clientLogger', or 'cliLogger' directly. Always import them as 'logger' using an alias. Example: import { serverLogger as logger } from '...';",
        },
      ],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', '**/.wrangler/**']),
]);

export default eslintConfig;
