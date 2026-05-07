import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import { readdirSync } from 'node:fs';
import { RulesConfig } from 'eslint';

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],
  eslintPluginUnicorn.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.svelte'],
        // tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'svelte/no-navigation-without-resolve': 'off',
    },
  },
  ...readdirSync('apps').map((name) => ({
    files: ['apps/**/*.svelte'],
    extends: [eslintPluginBetterTailwindcss.configs.recommended],
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/lib/app.css',
        cwd: `apps/${name}`,
      },
    },
    rules: {
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'better-tailwindcss/no-unknown-classes': 'off',
    } as Partial<RulesConfig>,
  })),
  {
    rules: {
      curly: 2,
      'no-shadow': 'off',
      'unicorn/require-module-specifiers': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prefer-event-target': 'off',
      'unicorn/no-thenable': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/import-style': 'off',
      'unicorn/prefer-structured-clone': 'off',
      'unicorn/no-for-loop': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/no-array-reverse': 'off', // toReversed() is not supported in Chrome 109 or Safari 15.4
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-spread': 'off',

      'prettier/prettier': 0,
      'object-shorthand': ['error', 'always'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    ignores: [
      'apps/**/.svelte-kit',
      'apps/**/build',
      'apps/**/backend/dist',
      'apps/**/.wrangler',
      'apps/**/backend/worker-configuration.d.ts',
      'packages/**/build/',
      'packages/**/.svelte-kit/',
      'packages/**/dist/',
      'common/',
    ],
  },
]);
