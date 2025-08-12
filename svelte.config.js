import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';

dotenv.config();

process.env.PUBLIC_IMMICH_PAY_HOST = process.env.PUBLIC_IMMICH_PAY_HOST || 'https://pay.futo.org';
process.env.PUBLIC_IMMICH_SPEC_URL = process.env.PUBLIC_IMMICH_SPEC_URL || 'https://static.immich.cloud/docs/spec.json';

process.env.PUBLIC_CF_TURNSTILE_SITE = process.env.PUBLIC_CF_TURNSTILE_SITE || '1x00000000000000000000BB';
process.env.PUBLIC_DATASET_API_ENDPOINT = process.env.PUBLIC_DATASET_API_ENDPOINT || '/api';

const app = process.env.IMMICH_APP || 'my.immich.app';

console.log(`Building for "${app}"`);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      fallback: 'index.html',
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
