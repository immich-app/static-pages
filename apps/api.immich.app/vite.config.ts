import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    allowedHosts: true,
    fs: {
      allow: ['../../common'],
    },
    proxy: process.env.IMMICH_SERVER_URL
      ? {
          '/api': {
            target: process.env.IMMICH_SERVER_URL,
            secure: true,
            changeOrigin: true,
            ws: true,
          },
        }
      : undefined,
  },
  test: {
    expect: { requireAssertions: true },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
  },
});
