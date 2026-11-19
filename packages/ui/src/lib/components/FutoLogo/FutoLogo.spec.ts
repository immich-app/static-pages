import FutoLogo from '#lib/components/FutoLogo/FutoLogo.svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

const html = (props: { class?: string } = {}) => render(FutoLogo, { props }).body;

describe('FutoLogo', () => {
  it('fills the coin with its own brand gradient', () => {
    const body = html();
    const id = /<linearGradient id="([^"]+)"/.exec(body)?.[1];

    expect(id).toBeTruthy();
    expect(body).toContain(`fill="url(#${id})"`);
    expect(body).toContain('stop-color="#405DB1"');
    expect(body).toContain('stop-color="#1BACC6"');
  });

  it('lets a class override the size', () => {
    const body = html({ class: 'size-4' });

    expect(body).toContain('size-4');
    expect(body).not.toContain('h-12');
  });
});
