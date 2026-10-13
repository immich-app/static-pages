import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

// eslint-disable-next-line unicorn/no-top-level-side-effects
dotenv.config({ path: '../../.env' });
process.env.PUBLIC_CF_TURNSTILE_SITE ||= '1x00000000000000000000BB';
process.env.PUBLIC_DATASET_API_ENDPOINT ||= '/api';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      // Consult https://svelte.dev/docs/kit/integrations
      // for more information about preprocessors
      preprocess: vitePreprocess(),
      adapter: adapter({ fallback: 'index.html' }),
      alias: {
        $common: '../../common',
        '$common/*': '../../common/*',
        '@immich/ui': resolve('../../packages/ui/dist'),
        '@mdi/js': resolve('./node_modules/@mdi/js'),
      },
    }),
  ],
  server: { fs: { allow: ['../../common'] } },
  optimizeDeps: {
    exclude: ['@immich/ui', '@immich/svelte-markdown-preprocess'],
  },
  test: {
    expect: { requireAssertions: true },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
  },
});
