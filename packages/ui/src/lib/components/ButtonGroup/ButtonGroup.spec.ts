import ButtonGroup from '#lib/components/ButtonGroup/ButtonGroup.svelte';
import { test } from '#test/fixtures.js';
import { describe, expect, vi } from 'vitest';

const items = [
  { value: 'visual', label: 'Visual' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML', disabled: true },
];

describe('ButtonGroup', () => {
  test('marks the item matching the value as selected', async ({ app, render }) => {
    await render(ButtonGroup, { items, value: 'json' });

    await expect.element(app.radio('JSON')).toHaveAttribute('aria-checked', 'true');
    await expect.element(app.radio('Visual')).toHaveAttribute('aria-checked', 'false');
  });

  test('selects nothing without a value', async ({ app, render }) => {
    await render(ButtonGroup, { items });

    await expect.element(app.radio('Visual')).toHaveAttribute('aria-checked', 'false');
    await expect.element(app.radio('JSON')).toHaveAttribute('aria-checked', 'false');
  });

  test('selects the clicked item', async ({ app, render }) => {
    const onValueChange = vi.fn();
    await render(ButtonGroup, { items, value: 'visual', onValueChange });

    await app.radio('JSON').click();

    await expect.element(app.radio('JSON')).toHaveAttribute('aria-checked', 'true');
    await expect.element(app.radio('Visual')).toHaveAttribute('aria-checked', 'false');
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('json');
  });

  test('keeps the selected item selected when clicked again', async ({ app, render }) => {
    const onValueChange = vi.fn();
    await render(ButtonGroup, { items, value: 'visual', onValueChange });

    await app.radio('Visual').click();

    await expect.element(app.radio('Visual')).toHaveAttribute('aria-checked', 'true');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test('ignores clicks on a disabled item', async ({ app, render }) => {
    const onValueChange = vi.fn();
    await render(ButtonGroup, { items, value: 'visual', onValueChange });

    await app.radio('YAML').click({ force: true });

    await expect.element(app.radio('Visual')).toHaveAttribute('aria-checked', 'true');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
