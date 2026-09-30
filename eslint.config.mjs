import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Business logic must never be imported into client bundles.
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@/server/*'] }],
    },
  },
  {
    // Theme Contract: themes are presentation only. They may use the theme SDK and
    // shared catalog definitions, never platform internals, the database, cookies or Node APIs.
    files: ['themes/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/*', '!@/theme-sdk', '!@/theme-sdk/*', '!@/catalog/*'], message: 'Themes may only import @/theme-sdk and @/catalog.' },
            { group: ['../../*', '../../../*'], message: 'Themes must not import other themes or platform files.' },
            { group: ['next/headers', 'next/server', 'server-only', 'drizzle-orm', 'drizzle-orm/*', 'postgres', 'node:*'], message: 'Themes must not access the server, database or Node APIs.' },
          ],
        },
      ],
      'react/no-danger': 'error',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'drizzle/**']),
]);
