import type { Page } from '@playwright/test';

export const createApp = (page: Page) => ({
  document: page.locator('html'),
  heading: (name: string) => page.getByRole('heading', { name, exact: true }),
  themeSwitch: page.getByRole('switch', { name: 'Toggle dark theme', exact: true }),
  storage: {
    seed: (key: string, value: string) =>
      page.addInitScript(([key, value]) => localStorage.setItem(key, value), [key, value] as const),
    block: () =>
      page.addInitScript(() =>
        Object.defineProperty(globalThis, 'localStorage', {
          get: () => {
            throw new DOMException('Access is denied for this document.', 'SecurityError');
          },
        }),
      ),
  },
});

export type App = ReturnType<typeof createApp>;
