import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { loadOpenApi } from '$lib/api/services/open-api';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load = (async ({ fetch }) => {
  try {
    await loadOpenApi(fetch);
  } catch (error) {
    console.log('Failed to load open-api specification', error);
    await goto(resolve('/'));
  }
}) satisfies LayoutLoad;
