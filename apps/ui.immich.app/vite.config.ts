import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type UserConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    fs: {
      allow: ['../../common'],
    },
  },
  optimizeDeps: {
    exclude: ['@immich/ui', '@immich/svelte-markdown-preprocess'],
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
} as UserConfig);
