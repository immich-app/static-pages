import ImageCarousel from '#lib/components/ImageCarousel/ImageCarousel.svelte';
import { test } from '#test/fixtures.js';
import { afterEach, describe, expect } from 'vitest';

const src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const items = Array.from({ length: 5 }, (_, i) => ({ id: `${i}`, title: `Photo ${i}`, href: '#', src }));

describe('ImageCarousel', () => {
  afterEach(() => document.documentElement.removeAttribute('dir'));

  test.for([
    { dir: 'ltr', forward: 400, end: 704, back: 304 },
    { dir: 'rtl', forward: -400, end: -704, back: -304 },
  ] as const)('navigates both ways in $dir', async ({ dir, forward, end, back }, { app, render }) => {
    app.setDirection(dir);
    await app.resizeWindow(800);
    await render(ImageCarousel, { items });
    const scrollPosition = () => app.scrollerOf('Photo 0').scrollLeft;
    await expect.element(app.button('Next')).toBeInTheDocument();
    await expect.element(app.button('Previous')).not.toBeInTheDocument();

    await app.button('Next').click();
    await expect.poll(scrollPosition).toBe(forward);
    await expect.element(app.button('Previous')).toBeInTheDocument();

    await app.button('Next').click();
    await expect.poll(scrollPosition).toBe(end);
    await expect.element(app.button('Next')).not.toBeInTheDocument();

    await app.button('Previous').click();
    await expect.poll(scrollPosition).toBe(back);
    await expect.element(app.button('Next')).toBeInTheDocument();

    await app.button('Previous').click();
    await expect.poll(scrollPosition).toBe(0);
    await expect.element(app.button('Previous')).not.toBeInTheDocument();
  });
});
