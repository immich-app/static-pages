import { getOpenApi } from '$lib/services/open-api';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ url, parent }) => {
  await parent();
  const { tags } = getOpenApi();
  const tag = tags.find((tag) => url.pathname.startsWith(tag.href));

  if (!tag) {
    return redirect(307, '/api');
  }

  return {
    tag,
  };
}) satisfies PageLoad;
