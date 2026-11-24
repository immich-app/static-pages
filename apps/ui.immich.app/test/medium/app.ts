import type { Page } from '@playwright/test';

export const createApp = (page: Page) => ({
  heading: (name: string) => page.getByRole('heading', { name, exact: true }),
});

export type App = ReturnType<typeof createApp>;
