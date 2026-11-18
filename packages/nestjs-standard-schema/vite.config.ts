import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: ['src/index.ts', 'src/zod.ts'],
      name: '@immich/nestjs-standard-schema',
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
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.spec.ts'],
        },
      },
    ],
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
