import { expect, test } from '../fixtures.js';

test.use({ viewport: { width: 1280, height: 400 } });

test.describe('Scrollable', () => {
  test('a link to a section opens at that section', async ({ page, app }) => {
    await page.goto('/getting-started#yarn');

    await expect(app.heading('yarn')).toBeInViewport();
  });
});
