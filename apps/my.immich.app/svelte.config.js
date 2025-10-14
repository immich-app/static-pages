import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: '../../.env' });

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: 'index.html',
    }),
    alias: {
      $common: '../common',
      '$common/*': '../../common/*',
      '@immich/ui': resolve('./node_modules/@immich/ui/dist'),
    },
  },
};

export default config;
