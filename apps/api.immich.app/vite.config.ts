import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// eslint-disable-next-line unicorn/no-top-level-side-effects
dotenv.config({ path: '../../.env' });

process.env.PUBLIC_IMMICH_SPEC_URL ||= 'https://docs.immich.app/openapi.json';

// eslint-disable-next-line unicorn/no-top-level-side-effects
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
        // TODO remove after $common is gone...
        '@immich/ui': resolve('../../packages/ui/dist'),
        '@mdi/js': resolve('./node_modules/@mdi/js'),
      },
    }),
  ],
  server: {
    allowedHosts: true,
    fs: {
      allow: ['../../common'],
    },
    proxy: process.env.IMMICH_SERVER_URL
      ? {
          '/api': {
            target: process.env.IMMICH_SERVER_URL,
            secure: true,
            changeOrigin: true,
            ws: true,
          },
        }
      : undefined,
  },
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
