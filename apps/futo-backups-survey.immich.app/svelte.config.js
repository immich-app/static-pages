import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

process.env.PUBLIC_CF_TURNSTILE_SITE = process.env.PUBLIC_CF_TURNSTILE_SITE || '1x00000000000000000000BB';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: 'index.html' }),
    alias: {
      $common: '../../common',
      '$common/*': '../../common/*',
    },
  },
};

export default config;
