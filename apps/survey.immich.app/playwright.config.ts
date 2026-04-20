import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '*.e2e.ts',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  // Retry twice in CI so transient flakes (WS timing, wrangler cold start)
  // don't block PRs. Locally, keep at 0 so real regressions surface
  // immediately instead of being masked by retries.
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
