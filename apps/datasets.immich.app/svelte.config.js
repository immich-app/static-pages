import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: '../../.env' });

process.env.PUBLIC_CF_TURNSTILE_SITE = process.env.PUBLIC_CF_TURNSTILE_SITE || '1x00000000000000000000BB';
process.env.PUBLIC_DATASET_API_ENDPOINT = process.env.PUBLIC_DATASET_API_ENDPOINT || '/api';

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
      $common: '../../common',
      '$common/*': '../../common/*',
      '@immich/ui': resolve('./node_modules/@immich/ui/dist'),
      '@mdi/js': resolve('./node_modules/@mdi/js'),
    },
  },
};

export default config;
