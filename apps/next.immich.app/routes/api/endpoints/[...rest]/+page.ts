import { getOpenApi } from '$lib/services/open-api.svelte';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (({ url }) => {
  const { tags } = getOpenApi();
  const tag = tags.find((tag) => url.pathname.startsWith(tag.href));

  if (!tag) {
    return redirect(307, '/api');
  }

  return {
    tag,
  };
}) satisfies PageLoad;
