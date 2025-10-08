import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const target = process.env.IMMICH_SERVER_URL || 'https://demo.immich.app/';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    // connect to a remote backend during web-only development
    proxy: {
      '/api': {
        target,
        secure: true,
        changeOrigin: true,
        ws: true,
      },
    },
    allowedHosts: true,
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'node',
  },
});
