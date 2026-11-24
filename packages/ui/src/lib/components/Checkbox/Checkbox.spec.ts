import { test } from '#test/fixtures.js';
import CheckboxField from '#test/components/CheckboxField.svelte';
import { describe, expect } from 'vitest';

describe('Checkbox', () => {
  test('is named by its field label', async ({ app, render }) => {
    await render(CheckboxField, { label: 'Accept' });

    await expect.element(app.checkbox('Accept')).toBeInTheDocument();
  });

  test('toggles when its field label is clicked', async ({ app, render }) => {
    await render(CheckboxField, { label: 'Accept' });

    await app.clickText('Accept');

    await expect.element(app.checkbox('Accept')).toBeChecked();
  });
});
