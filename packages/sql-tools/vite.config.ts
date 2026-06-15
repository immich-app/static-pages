import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: ['src/index.ts', 'src/bin/cli.ts'],
      name: '@immich/sql-tools',
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
      {
        extends: true,
        test: {
          name: 'medium',
          globalSetup: ['test/medium/globalSetup.ts'],
          include: ['test/medium/**/*.spec.ts'],
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
  plugins: [dts({ rollupTypes: true, tsconfigPath: './tsconfig.json' })],
});
