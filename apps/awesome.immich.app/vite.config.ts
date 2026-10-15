import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

// eslint-disable-next-line unicorn/no-top-level-side-effects
dotenv.config({ path: '../../.env' });

const staticFiles = new Set(['/favicon.ico', '/img/social-preview.png']);

// eslint-disable-next-line unicorn/no-top-level-side-effects
export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter(),
      alias: {
        $common: '../../common',
        '$common/*': '../../common/*',
        '@immich/ui': resolve('../../packages/ui/dist'),
        '@mdi/js': resolve('./node_modules/@mdi/js'),
      },
      prerender: {
        handleHttpError: ({ path, message }) => {
          if (staticFiles.has(path)) {
            return;
          }

          // otherwise fail the build
          throw new Error(message);
        },
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
