import { goto } from '$app/navigation';
import { loadOpenApi } from '$lib/services/open-api.svelte';
import type { LayoutLoad } from './$types';

export const load = (async ({ fetch }) => {
  try {
    await loadOpenApi(fetch);
  } catch (error) {
    console.log('Failed to load open-api specification', error);
    await goto('/');
  }
}) satisfies LayoutLoad;
