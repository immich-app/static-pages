import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';

dotenv.config();

process.env.PUBLIC_IMMICH_PAY_HOST = process.env.PUBLIC_IMMICH_PAY_HOST || 'https://pay.futo.org';
process.env.PUBLIC_IMMICH_API_HOST = process.env.PUBLIC_IMMICH_API_HOST || 'https://api.immich.app';

const app = process.env.IMMICH_APP || 'my.immich.app';
if (!app) {
  throw new Error('IMMICH_APP environment variable is required');
}

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
      routes: `./apps/${app}`,
      appTemplate: `./apps/${app}/app.html`,
    },
  },
};

export default config;
