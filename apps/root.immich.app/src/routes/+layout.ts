import { browser } from '$app/env';
import type { SearchDoc } from '$lib/search';
import type { LayoutLoad } from './$types';

export const prerender = true;

export const load = (async ({ fetch }) => {
  if (!browser) {
    return { docs: [] };
  }

  try {
    const response = await fetch('/data/search.json');
    const docs = (await response.json()) as SearchDoc[];
    return { docs };
  } catch (error) {
    console.log(error);
    return { docs: [] };
  }
}) satisfies LayoutLoad;
