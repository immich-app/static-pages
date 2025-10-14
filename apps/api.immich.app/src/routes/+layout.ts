import { goto } from '$app/navigation';
import { loadOpenApi } from '$lib/services/open-api';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load = (async ({ fetch }) => {
  try {
    await loadOpenApi(fetch);
  } catch (error) {
    console.log('Failed to load open-api specification', error);
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    await goto('/');
  }
}) satisfies LayoutLoad;
