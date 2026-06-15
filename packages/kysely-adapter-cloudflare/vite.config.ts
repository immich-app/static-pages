import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: ['src/index.ts'],
      name: '@immich/kysely-adapter-cloudflare',
      formats: ['es'],
    },
    rolldownOptions: {
      output: {
        dir: 'dist',
      },
    },
    ssr: true,
  },
  resolve: {
    tsconfigPaths: true,
  },
  ssr: {
    noExternal: /^src.*$/,
  },
  test: {
    server: {
      deps: {
        fallbackCJS: true,
      },
    },
    env: {
      TZ: 'UTC',
    },
  },
  plugins: [dts({ rollupTypes: true, tsconfigPath: './tsconfig.json' })],
});
