import { defineConfig, devices } from '@playwright/test';

const port = 3110;
const baseURL = `http://127.0.0.1:${port}`;
const devServer = !!process.env.PLAYWRIGHT_DEV_SERVER;
const ci = !!process.env.CI;
const serverFlags = `--host 127.0.0.1 --port ${port} --strictPort`;

export default defineConfig({
  testDir: './test/medium/specs',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 2 : 0,
  reporter: ci ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    locale: 'en-US',
    timezoneId: 'UTC',
    reducedMotion: 'reduce',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: devServer ? `pnpm exec vite dev ${serverFlags}` : `pnpm build && pnpm exec vite preview ${serverFlags}`,
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !ci,
    stdout: ci ? 'pipe' : 'ignore',
    stderr: 'pipe',
  },
});
