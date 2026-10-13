import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

// eslint-disable-next-line unicorn/no-top-level-side-effects
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
  plugins: [dts({ entryRoot: 'src', tsconfigPath: './tsconfig.json' })],
});
