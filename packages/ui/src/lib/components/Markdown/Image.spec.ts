import Image from '$lib/components/Markdown/Image.svelte';
import { IMAGE_SIZES_QUERY } from '$lib/utilities/image-sizes.js';
import type { ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

const html = (props: ComponentProps<typeof Image>) => render(Image, { props }).body;

describe('Markdown.Image', () => {
  it('serves the srcset the post declares, sized against the article column', () => {
    const srcset = 'https://cdn/x-720.avif 720w, https://cdn/x-2160.avif 2160w';
    const body = html({ src: 'https://cdn/x-2160.avif', srcset, width: 2160, height: 1440 });

    expect(body).toContain('src="https://cdn/x-2160.avif"');
    expect(body).toContain(`srcset="${srcset}"`);
    expect(body).toContain(`sizes="${IMAGE_SIZES_QUERY}"`);
    expect(body).toContain('width="2160"');
    expect(body).toContain('height="1440"');
  });

  it('renders a bare img when the post declares no variants', () => {
    const body = html({ src: 'https://cdn/x.webp' });

    expect(body).toContain('src="https://cdn/x.webp"');
    expect(body).not.toContain('srcset');
    expect(body).not.toContain('sizes');
  });

  it('loads lazily unless marked as priority', () => {
    expect(html({ src: 'https://cdn/x.webp' })).toContain('loading="lazy"');

    const priority = html({ src: 'https://cdn/x.webp', priority: true });
    expect(priority).toContain('loading="eager"');
    expect(priority).toContain('fetchpriority="high"');
  });
});
