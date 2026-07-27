import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  optimizeDeps: {
    include: ['chart.js'],
  },
  server: {
    fs: {
      // `../../common` is the shared repo-level component library; `./shared`
      // holds ws-protocol.ts + answer-validation.ts imported via the `$shared`
      // alias by both the survey UI and its backend. Without allowing it Vite
      // 403s the import and every respondent page renders a 500.
      allow: ['../../common', './shared'],
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:8787',
        ws: true,
      },
    },
    watch: {
      ignored: ['**/backend/**'],
    },
  },
  test: {
    expect: { requireAssertions: true },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
  },
});
