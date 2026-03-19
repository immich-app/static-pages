import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: 'index.html' }),
    alias: {
      $common: '../../common',
      '$common/*': '../../common/*',
      '@immich/ui': resolve('./node_modules/@immich/ui/dist'),
      '@mdi/js': resolve('./node_modules/@mdi/js'),
    },
  },
};

export default config;
