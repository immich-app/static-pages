import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

dotenv.config({ path: '../../.env' });

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({ fallback: 'index.html' }),
      alias: {
        $common: '../../common',
        '$common/*': '../../common/*',
        '@immich/ui': resolve('../../packages/ui/dist'),
      },
    }),
  ],
  server: {
    fs: { allow: ['../../common'] },
    proxy: { '/api': 'http://localhost:8787' },
  },
  optimizeDeps: {
    exclude: ['@immich/ui'],
  },
});
