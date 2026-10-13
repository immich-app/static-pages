import { defineConfig } from 'vitest/config';

// eslint-disable-next-line unicorn/no-top-level-side-effects
export default defineConfig({
  test: {
    include: ['{src,test}/**/*.{test,spec}.{js,ts}'],
    testTimeout: 30_000, // the media specs run the real encoders
  },
});
