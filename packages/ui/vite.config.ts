import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, type UserConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit({ preprocess: vitePreprocess() })],
  preview: { allowedHosts: true },
  test: {
    name: 'ui:unit',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./test/setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ contextOptions: { timezoneId: 'UTC', locale: 'en-US' } }),
      instances: [{ browser: 'chromium' }],
    },
  },
} as UserConfig);
