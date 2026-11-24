import Image from '#lib/components/Markdown/Image.svelte';
import { test } from '#test/fixtures.js';
import { describe, expect } from 'vitest';

const src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const sizes = '(min-width: 748px) 714px, calc(100vw - 34px)';

describe('Markdown.Image', () => {
  test('serves the srcset the post declares, sized against the article column', async ({ app, render }) => {
    const srcset = `${src} 720w, ${src} 2160w`;

    await render(Image, { src, srcset, width: 2160, height: 1440, alt: 'Timeline' });

    await expect.element(app.image('Timeline')).toHaveAttribute('src', src);
    await expect.element(app.image('Timeline')).toHaveAttribute('srcset', srcset);
    await expect.element(app.image('Timeline')).toHaveAttribute('sizes', sizes);
    await expect.element(app.image('Timeline')).toHaveAttribute('width', '2160');
    await expect.element(app.image('Timeline')).toHaveAttribute('height', '1440');
  });

  test('renders a bare img when the post declares no variants', async ({ app, render }) => {
    await render(Image, { src, alt: 'Timeline' });

    await expect.element(app.image('Timeline')).toHaveAttribute('src', src);
    await expect.element(app.image('Timeline')).not.toHaveAttribute('srcset');
    await expect.element(app.image('Timeline')).not.toHaveAttribute('sizes');
  });

  test('loads lazily unless marked as priority', async ({ app, render }) => {
    await render(Image, { src, alt: 'Lazy' });
    await render(Image, { src, alt: 'Priority', priority: true });

    await expect.element(app.image('Lazy')).toHaveAttribute('loading', 'lazy');
    await expect.element(app.image('Priority')).toHaveAttribute('loading', 'eager');
    await expect.element(app.image('Priority')).toHaveAttribute('fetchpriority', 'high');
  });
});
