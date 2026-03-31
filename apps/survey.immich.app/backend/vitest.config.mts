import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.integration.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    sequence: {
      concurrent: false,
    },
    fileParallelism: false,
  },
});
