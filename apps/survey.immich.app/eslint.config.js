import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },

    rules: {
      'svelte/no-navigation-without-resolve': 'off',
    },
  },
  {
    // Disable a few rules that are noisy (or meaningless) on the backend /
    // e2e code where the frontend-centric defaults don't apply, but keep
    // the core TS checks on. This lets us catch obvious mistakes in those
    // trees without needing a full secondary config.
    files: ['backend/**/*.ts', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: [
      'build/',
      '.svelte-kit/',
      'dist/',
      'backend/dist/',
      'backend/.wrangler/',
      'backend/.svelte-kit/',
    ],
  },
];
