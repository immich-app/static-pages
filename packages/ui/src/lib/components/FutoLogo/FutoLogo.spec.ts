import FutoLogo from '#lib/components/FutoLogo/FutoLogo.svelte';
import { test } from '#test/fixtures.js';
import { describe, expect } from 'vitest';

describe('FutoLogo', () => {
  test('fills the coin with its own brand gradient', async ({ app, render }) => {
    await render(FutoLogo, {});

    const logo = app.image('FUTO logo').element();
    const gradient = logo.querySelector('linearGradient');
    const stops = [...logo.querySelectorAll('stop')].map((stop) => stop.getAttribute('stop-color'));

    expect(gradient?.id).toBeTruthy();
    expect(logo.querySelector('path')?.getAttribute('fill')).toBe(`url(#${gradient?.id})`);
    expect(stops).toEqual(['#405DB1', '#4F91DC', '#1BACC6']);
  });

  test('lets a class override the size', async ({ app, render }) => {
    await render(FutoLogo, { class: 'size-4' });

    await expect.element(app.image('FUTO logo')).toHaveClass('size-4');
    await expect.element(app.image('FUTO logo')).not.toHaveClass('h-12');
  });
});
