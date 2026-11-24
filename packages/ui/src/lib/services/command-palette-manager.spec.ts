import { commandPaletteManager } from '#lib/services/command-palette-manager.svelte.js';
import { test } from '#test/fixtures.js';
import { describe, expect } from 'vitest';

describe('commandPaletteManager', () => {
  test('reopens after Enter is pressed with no results', async ({ app }) => {
    commandPaletteManager.enable();
    await app.press('/');
    await expect.element(app.commandPalette()).toBeVisible();

    await app.press('{Enter}');
    await app.press('{Escape}');
    await expect.element(app.commandPalette()).not.toBeInTheDocument();
    await app.press('/');

    await expect.element(app.commandPalette()).toBeVisible();
  });
});
