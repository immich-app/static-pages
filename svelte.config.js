import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const app = process.env.IMMICH_APP;
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
