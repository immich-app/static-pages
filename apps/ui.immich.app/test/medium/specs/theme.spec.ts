import { expect, test } from '../fixtures.js';

test.describe('theme', () => {
  test.describe('with a dark system theme', () => {
    test.use({ colorScheme: 'dark' });

    for (const stored of ['dark', 'null']) {
      test(`stored theme ${stored} falls back to the system theme`, async ({ page, app }) => {
        await app.storage.seed('immich-ui-theme', stored);

        await page.goto('/getting-started');

        await expect(app.themeSwitch).toBeChecked();
      });
    }
  });

  test('switches theme when storage is blocked', async ({ page, app }) => {
    await app.storage.block();
    await page.goto('/getting-started');

    await app.themeSwitch.click();

    await expect(app.themeSwitch).toBeChecked();
    await expect(app.document).toContainClass('dark');
  });
});
