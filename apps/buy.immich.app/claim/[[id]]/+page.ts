import { callback } from '$lib/utils/oauth';
import type { PageLoad } from './$types';

export const load = (async ({ fetch, url, params }) => {
  if (params.id === 'callback') {
    const { response, error } = await callback(fetch, url.href);
    return { response, error };
  }
}) satisfies PageLoad;
