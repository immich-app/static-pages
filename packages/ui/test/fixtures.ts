import TooltipProvider from '#lib/components/Tooltip/TooltipProvider.svelte';
import { createApp, type App } from '#test/app.js';
import { MockConsole } from '#test/mocks/console.js';
import type { Component } from 'svelte';
import { test as base, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';

const renderWithProviders = <Props extends Record<string, unknown>>(component: Component<Props>, props: Props) =>
  render(component, props, { wrapper: TooltipProvider });

type Fixtures = {
  logger: MockConsole;
  render: typeof renderWithProviders;
  app: App;
};

export const test = base.extend<Fixtures>({
  logger: [
    async ({ task: _ }, use) => {
      const logger = new MockConsole();
      logger.setup();
      await use(logger);
      logger.teardown();
      expect(logger.errors, 'unexpected browser errors').toEqual([]);
    },
    { auto: true },
  ],
  render: async ({ task: _ }, use) => {
    await use(renderWithProviders);
  },
  app: async ({ task: _ }, use) => {
    await use(createApp());
  },
});
