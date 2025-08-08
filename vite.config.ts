import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    // connect to a remote backend during web-only development
    proxy: {
      '/api': {
        target: 'https://demo.immich.app/',
        secure: true,
        changeOrigin: true,
        ws: true,
      },
    },
    allowedHosts: true,
  },
});
