import { defineConfig } from 'vitest/config';

// eslint-disable-next-line unicorn/no-top-level-side-effects
export default defineConfig({
  test: {
    include: ['{src,test}/**/*.{test,spec}.{js,ts}'],
  },
});
