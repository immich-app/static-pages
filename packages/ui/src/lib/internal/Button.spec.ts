import Button from '#lib/components/Button/Button.svelte';
import IconButton from '#lib/components/IconButton/IconButton.svelte';
import ListButton from '#lib/components/ListButton/ListButton.svelte';
import { test } from '#test/fixtures.js';
import { mdiOpenInNew } from '@mdi/js';
import { createRawSnippet, type Component } from 'svelte';
import { describe, expect, vi } from 'vitest';

const children = createRawSnippet(() => ({ render: () => '<span>Open</span>' }));

const components = [
  { name: 'Button', component: Button as Component, props: { children } },
  { name: 'IconButton', component: IconButton as Component, props: { icon: mdiOpenInNew, 'aria-label': 'Open' } },
  { name: 'ListButton', component: ListButton as Component, props: { children } },
];

const states = [
  { state: 'disabled', props: { disabled: true } },
  { state: 'loading', props: { loading: true } },
];

describe.each(components)('$name with href', ({ component, props }) => {
  test('navigates and calls onclick when enabled', async ({ app, render }) => {
    const onclick = vi.fn();
    await render(component, { ...props, href: '#enabled', onclick });

    await app.forceClick('Open');

    expect(onclick).toHaveBeenCalledOnce();
    expect(location.hash).toBe('#enabled');
  });

  test('is reached by Tab when enabled', async ({ app, render }) => {
    await render(component, { ...props, href: '#enabled' });

    await app.pressTab();

    await expect.element(app.link('Open')).toHaveFocus();
  });

  test.for(states)('ignores clicks when $state', async ({ state, props: stateProps }, { app, render }) => {
    const onclick = vi.fn();
    await render(component, { ...props, ...stateProps, href: `#${state}`, onclick });

    await app.forceClick('Open');

    expect(onclick).not.toHaveBeenCalled();
    expect(location.hash).not.toBe(`#${state}`);
  });

  test.for(states)('is skipped by Tab when $state', async ({ props: stateProps }, { app, render }) => {
    await render(component, { ...props, ...stateProps, href: '#skipped' });

    await app.pressTab();

    await expect.element(app.link('Open')).not.toHaveFocus();
  });
});
