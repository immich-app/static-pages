import { svelteMarkdownPreprocess } from '@immich/svelte-markdown-preprocess';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

const staticFiles = new Set(['/favicon.ico', '/img/social-preview.png']);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [
    svelteMarkdownPreprocess({
      layouts: {
        default: { name: 'Markdown.Page', source: '@immich/ui', import: false },
      },
    }),
    vitePreprocess(),
  ],
  kit: {
    adapter: adapter(),
    alias: {
      $common: '../../common',
      '$common/*': '../../common/*',
      // TODO remove after $common is gone...
      '@immich/ui': resolve('../../packages/ui/dist'),
    },
    prerender: {
      handleHttpError: ({ path, message }) => {
        if (staticFiles.has(path)) {
          return;
        }

        // otherwise fail the build
        throw new Error(message);
      },
    },
  },
};

export default config;
