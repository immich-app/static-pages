import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';
import { svelteMarkdownPreprocess } from './svelte-markdown-preprocess/index.js';

dotenv.config();

process.env.PUBLIC_IMMICH_PAY_HOST = process.env.PUBLIC_IMMICH_PAY_HOST || 'https://pay.futo.org';
process.env.PUBLIC_IMMICH_ENV = process.env.PUBLIC_IMMICH_ENV || 'production';
process.env.PUBLIC_IMMICH_SPEC_URL = process.env.PUBLIC_IMMICH_SPEC_URL || 'https://docs.immich.app/openapi.json';

process.env.PUBLIC_CF_TURNSTILE_SITE = process.env.PUBLIC_CF_TURNSTILE_SITE || '1x00000000000000000000BB';
process.env.PUBLIC_DATASET_API_ENDPOINT = process.env.PUBLIC_DATASET_API_ENDPOINT || '/api';

const app = process.env.IMMICH_APP || 'my.immich.app';

process.env.PUBLIC_IMMICH_HOSTNAME ??= app;

const prerenderApps = ['root.immich.app'];

console.log(`Building for "${app}"`);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [
    svelteMarkdownPreprocess({
      layouts: {
        blog: '$lib/layouts/BlogLayout.svelte',
        default: '$lib/layouts/DefaultPageLayout.svelte',
      },
    }),
    vitePreprocess(),
  ],

  kit: {
    adapter: adapter({
      fallback: prerenderApps.includes(app) ? undefined : 'index.html',
    }),
    files: {
      routes: `./apps/${app}/routes`,
      appTemplate: `./apps/${app}/routes/app.html`,
    },
    // this is to grab types for an app with a worker backend
    typescript: {
      config: (config) => {
        config.include.push(`../apps/${app}/types/*.ts`);
      },
    },
  },
};

export default config;
