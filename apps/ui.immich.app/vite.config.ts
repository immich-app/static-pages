import { svelteMarkdownPreprocess } from '@immich/svelte-markdown-preprocess';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';
import { svelteMarkdownVite } from '@immich/svelte-markdown-preprocess';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type UserConfig } from 'vite';

const staticFiles = new Set(['/favicon.ico', '/img/social-preview.png']);

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      extensions: ['.svelte', '.md'],
      preprocess: [
        svelteMarkdownPreprocess({ layouts: { default: '#lib/components/MarkdownPage.svelte' } }),
        vitePreprocess(),
      ],
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
    }),
    svelteMarkdownVite(),
  ],
  server: { fs: { allow: ['../../common'] } },
  optimizeDeps: {
    exclude: ['@immich/ui', '@immich/svelte-markdown-preprocess'],
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
} as UserConfig);
