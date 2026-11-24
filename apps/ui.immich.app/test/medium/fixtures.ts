import { createApp, type App } from './app.js';
import { test as base, expect } from '@playwright/test';

export { expect } from '@playwright/test';

type Fixtures = {
  failOnBrowserErrors: void;
  app: App;
};

export const test = base.extend<Fixtures>({
  failOnBrowserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(`[pageerror] ${error.stack || `${error.name}: ${error.message}`}`);
      });
      page.on('console', (message) => {
        if (message.type() === 'error') {
          errors.push(`[console.error] ${message.text()}`);
        }
      });
      await use();
      expect(errors, 'unexpected browser errors').toEqual([]);
    },
    { auto: true },
  ],
  app: async ({ page }, use) => {
    await use(createApp(page));
  },
});
