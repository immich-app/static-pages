import { svelteMarkdownPreprocess } from '@immich/svelte-markdown-preprocess';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: '../../.env' });

process.env.PUBLIC_IMMICH_ENV = process.env.PUBLIC_IMMICH_ENV ?? 'production';

const staticFiles = ['/favicon.ico', '/img/social-preview.png'];

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [svelteMarkdownPreprocess(), vitePreprocess()],
  kit: {
    adapter: adapter(),
    alias: {
      $common: '../../common',
      '$common/*': '../../common/*',
      '@immich/ui': resolve('./node_modules/@immich/ui/dist'),
    },
    prerender: {
      handleHttpError: ({ path, message }) => {
        if (staticFiles.includes(path)) {
          return;
        }

        // otherwise fail the build
        throw new Error(message);
      },
    },
  },
};

export default config;
