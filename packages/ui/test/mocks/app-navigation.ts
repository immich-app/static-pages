import { onMount } from 'svelte';
import type { AfterNavigate } from '$app/navigation';

export const goto = (url: string | URL) => {
  throw new Error(`Unexpected navigation to ${url}`);
};

export const afterNavigate = (callback: (navigation: AfterNavigate) => void) => {
  onMount(() => {
    callback({ type: 'enter', from: null, to: null, shallow: false, willUnload: false, complete: Promise.resolve() });
  });
};
