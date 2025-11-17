import { loadOpenApi } from '$lib/services/open-api';
import type { LayoutLoad } from './$types';

export const ssr = false;

export const load = (async ({ fetch }) => {
  let error: Error | unknown;
  try {
    await loadOpenApi(fetch);
  } catch (loadError: Error | unknown) {
    error = loadError;
  }

  return {
    error,
  };
}) satisfies LayoutLoad;
