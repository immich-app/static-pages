import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],
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
    // idk why svelte.ts files are not being parsed correctly
    ignores: ['build/', '.svelte-kit/', 'dist/', 'apps/**/backend/worker-configuration.d.ts', '**/*.svelte.ts'],
  },
];
