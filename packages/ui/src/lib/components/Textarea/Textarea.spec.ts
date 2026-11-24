import Textarea from '#lib/components/Textarea/Textarea.svelte';
import { test } from '#test/fixtures.js';
import { describe, expect } from 'vitest';

describe('Textarea', () => {
  test('grows to show every line when its width shrinks', async ({ app, render }) => {
    const textarea = app.textarea('Description');
    const hiddenHeight = () => textarea.element().scrollHeight - textarea.element().clientHeight;
    await app.resizeWindow(1200);
    await render(Textarea, { grow: true, value: 'word '.repeat(80), 'aria-label': 'Description' });
    await expect.poll(hiddenHeight).toBe(0);

    await app.resizeWindow(320);

    await expect.poll(hiddenHeight).toBe(0);
  });
});
